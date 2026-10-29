#!/usr/bin/env node
/**
 * Media pipeline: media-src/<project>/  →  public/media/<project>/
 *
 *   npm run media          optimise new or changed sources, write media-manifest.json
 *                          and the runtime map (src/data/media-variants.json)
 *   npm run media:check    read-only: verify references, manifest, outputs and paths
 *
 * What it handles
 *   .webp .jpg .jpeg .png  raster sources. Always published as WebP (quality per
 *          project, see media.config.json), as a set of widths for srcset:
 *            name.webp         the base: the largest version, up to maxWidth
 *            name-<w>w.webp    one per width in `widths` smaller than the base
 *          The source is never enlarged. EXIF orientation is applied. Every
 *          output is compared with the source at the same size; if the mean
 *          error is above maxMeanError, it is encoded again at fallbackQuality.
 *          A WebP source that would not shrink by minSaving (and needs no resize)
 *          is copied byte for byte as the base.
 *   .svg   optimised with SVGO (conservative settings) unless it embeds raster
 *          images (data:image/…), which are copied untouched. The optimised file
 *          is published only if structure and a pixel comparison match the source.
 *   other  (mp4, archived sources) are left in media-src and never published.
 *
 * Files that live directly in public/media and are not in the manifest are
 * manual files (MP4, posters, GIF, JPG). The script never overwrites or removes
 * them. It never writes into media-src.
 *
 * Options
 *   --check        read-only verification, exit code 1 on errors
 *   --root <dir>   project root (default: current directory)
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { optimize, VERSION as SVGO_VERSION } from 'svgo';

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const rootArg = args.indexOf('--root');
const ROOT = path.resolve(rootArg >= 0 ? args[rootArg + 1] : process.cwd());

const config = JSON.parse(await fs.readFile(path.join(ROOT, 'media.config.json'), 'utf8'));
const SRC_DIR = path.join(ROOT, config.sourceDir);
const OUT_DIR = path.join(ROOT, config.outputDir);
const PUBLIC_DIR = path.dirname(OUT_DIR); // /media/… is served from public/media/…
const MANIFEST_PATH = path.join(ROOT, config.manifest);
const RUNTIME_MAP_PATH = config.runtimeMap ? path.join(ROOT, config.runtimeMap) : null;
const RASTER_EXT = ['.webp', '.jpg', '.jpeg', '.png'];

const TOOLS = { sharp: sharp.versions.sharp, libwebp: sharp.versions.webp, librsvg: sharp.versions.rsvg, svgo: SVGO_VERSION };

/* SVGO: preset-default minus every plugin that can drop ids, hidden or
   "default" content, metadata or merge paths. High numeric precision. */
const SVGO_CONFIG = {
  multipass: true,
  floatPrecision: 6,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupIds: false,
          removeUnknownsAndDefaults: false,
          removeHiddenElems: false,
          removeDesc: false,
          removeMetadata: false,
          mergePaths: false,
          convertTransform: { transformPrecision: 8 },
        },
      },
    },
  ],
};

/* ---------- helpers ---------- */

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const stableJson = (value) => JSON.stringify(sortKeys(value), null, 2) + '\n';
function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]));
  return v;
}
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

function assertInside(dir, target) {
  const r = path.relative(dir, target);
  if (r.startsWith('..') || path.isAbsolute(r)) throw new Error(`Refusing to touch ${target}: outside ${dir}`);
}

async function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.isFile()) out.push(full);
  }
  return out.sort();
}

async function readManifest() {
  if (!existsSync(MANIFEST_PATH)) return { files: {} };
  return JSON.parse(await fs.readFile(MANIFEST_PATH, 'utf8'));
}

function roleOf(name) {
  if (/-hero-mobile\.[a-z0-9]+$/i.test(name)) return 'heroMobile';
  if (/-hero\.[a-z0-9]+$/i.test(name)) return 'hero';
  if (/-thumbnail\.[a-z0-9]+$/i.test(name)) return 'thumbnail';
  return 'content';
}

function settingsFor(srcRel) {
  const ext = path.extname(srcRel).toLowerCase();
  const project = srcRel.split('/')[1];
  if (RASTER_EXT.includes(ext)) {
    const role = roleOf(srcRel);
    const w = config.webp;
    return {
      kind: 'raster',
      role,
      sourceExt: ext,
      quality: w.qualityByProject?.[project] ?? w.quality,
      fallbackQuality: w.fallbackQuality,
      effort: w.effort,
      maxWidth: w.maxWidth[role] ?? null,
      widths: w.widths,
      maxMeanError: w.maxMeanError,
      metric: 'premultiplied-rgba',
      minSaving: config.minSaving,
      tools: { sharp: TOOLS.sharp, libwebp: TOOLS.libwebp },
    };
  }
  if (ext === '.svg') {
    return { kind: 'svg', svgo: SVGO_CONFIG, compare: config.svg, metric: 'premultiplied-rgba', minSaving: config.minSaving, tools: { sharp: TOOLS.sharp, librsvg: TOOLS.librsvg, svgo: TOOLS.svgo } };
  }
  return null;
}

// Public path of the base output: rasters always become .webp
function baseOutRel(srcRel, s) {
  const r = path.relative(SRC_DIR, path.join(ROOT, srcRel)).split(path.sep).join('/');
  return s.kind === 'raster' ? r.replace(/\.[a-z0-9]+$/i, '.webp') : r;
}

const variantRel = (baseRel, width) => baseRel.replace(/\.webp$/i, `-${width}w.webp`);

// Size after EXIF orientation (orientations 5–8 swap width and height)
async function orientedSize(buf) {
  const m = await sharp(buf).metadata();
  return m.orientation >= 5 ? { width: m.height, height: m.width } : { width: m.width, height: m.height };
}

// Widths a raster source produces: the base first, then the smaller variants
async function plannedWidths(srcBuf, s) {
  const { width } = await orientedSize(srcBuf);
  const base = s.maxWidth ? Math.min(width, s.maxWidth) : width;
  return { sourceWidth: width, base, variants: s.widths.filter((w) => w < base) };
}

/* ---------- image comparison ---------- */

async function rawRGBA(input, { width, height, density }) {
  return sharp(input, density ? { density } : {})
    .rotate() // EXIF orientation (no-op without it)
    .resize({ width, height, fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
}

function diff(a, b, tolerance = 0) {
  if (a.length !== b.length) return { mean: Infinity, differing: 1 };
  let sum = 0, differing = 0;
  // Colour is compared premultiplied by alpha: fully transparent pixels can hold
  // any RGB value without changing what is drawn, so they must not count as error.
  for (let i = 0; i < a.length; i += 4) {
    const aa = a[i + 3], ba = b[i + 3];
    let over = false;
    for (let c = 0; c < 4; c++) {
      const d = c === 3 ? Math.abs(aa - ba) : Math.abs((a[i + c] * aa - b[i + c] * ba) / 255);
      sum += d;
      if (d > tolerance) over = true;
    }
    if (over) differing++;
  }
  return { mean: sum / a.length, differing: differing / (a.length / 4) };
}

/* ---------- processors ---------- */

async function encodeWebp(srcBuf, width, quality, effort) {
  return sharp(srcBuf).rotate().resize({ width, withoutEnlargement: true }).webp({ quality, effort }).toBuffer();
}

// Mean error of an output against the source scaled to the same size, so only
// encoding loss is measured.
async function meanError(srcBuf, out) {
  const m = await sharp(out).metadata();
  const a = await rawRGBA(srcBuf, { width: m.width, height: m.height });
  const b = await rawRGBA(out, { width: m.width, height: m.height });
  return { mean: diff(a.data, b.data).mean, width: m.width, height: m.height };
}

// One WebP at one width; falls back to fallbackQuality above maxMeanError
async function encodeChecked(srcBuf, width, s) {
  let quality = s.quality;
  let buffer = await encodeWebp(srcBuf, width, quality, s.effort);
  let check = await meanError(srcBuf, buffer);
  if (check.mean > s.maxMeanError && s.fallbackQuality > quality) {
    quality = s.fallbackQuality;
    buffer = await encodeWebp(srcBuf, width, quality, s.effort);
    check = await meanError(srcBuf, buffer);
  }
  return { buffer, quality, ...check };
}

// Returns { outputs: [{ width, height, buffer, quality }], action, reason }
async function processRaster(srcBuf, s) {
  const plan = await plannedWidths(srcBuf, s);
  const resized = plan.base < plan.sourceWidth;
  const outputs = [];

  // Base: a WebP source that needs no resize and would not shrink enough is
  // copied byte for byte (no second lossy pass).
  let base = await encodeChecked(srcBuf, plan.base, s);
  let action = 'optimized';
  const saving = 1 - base.buffer.length / srcBuf.length;
  if (s.sourceExt === '.webp' && !resized && saving < s.minSaving) {
    const size = await orientedSize(srcBuf);
    base = { buffer: srcBuf, quality: null, mean: 0, ...size };
    action = 'copied';
  }
  outputs.push(base);

  for (const width of plan.variants) outputs.push(await encodeChecked(srcBuf, width, s));

  const fallback = outputs.filter((o) => o.quality && o.quality !== s.quality).length;
  const reason = [
    action === 'copied' ? `base copied (saving ${(saving * 100).toFixed(1)}% < ${s.minSaving * 100}%)` : `base ${base.width}px q${base.quality}${resized ? ` (resized from ${plan.sourceWidth}px)` : ''}`,
    `${plan.variants.length} variant${plan.variants.length === 1 ? '' : 's'}${plan.variants.length ? ` (${plan.variants.join(', ')})` : ''}`,
    `max mean error ${Math.max(...outputs.map((o) => o.mean)).toFixed(2)}`,
    fallback ? `${fallback} at q${s.fallbackQuality}` : null,
  ].filter(Boolean).join(', ');
  return { outputs, action, reason };
}

const SVG_COUNTED = ['mask', 'filter', 'linearGradient', 'radialGradient', 'clipPath', 'pattern', 'text', 'tspan', 'title', 'image', 'symbol', 'use'];

function svgFacts(svg) {
  const root = svg.match(/<svg\b[^>]*>/)?.[0] ?? '';
  const attr = (n) => root.match(new RegExp(`\\s${n}="([^"]*)"`))?.[1]?.trim().split(/[\s,]+/).map(Number).join(' ') ?? null;
  const counts = Object.fromEntries(SVG_COUNTED.map((t) => [t, (svg.match(new RegExp(`<${t}[\\s>/]`, 'g')) ?? []).length]));
  const ids = new Set([...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const refs = new Set([...svg.matchAll(/url\(\s*['"]?#([^'")\s]+)/g), ...svg.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]));
  return { viewBox: attr('viewBox'), width: attr('width'), height: attr('height'), counts, ids, refs };
}

async function processSvg(srcBuf, s) {
  const src = srcBuf.toString('utf8');
  if (/data:image\//i.test(src)) return { buffer: srcBuf, action: 'copied', reason: 'embeds raster image (data:image/), excluded from SVGO' };

  const out = optimize(src, s.svgo).data;
  const outBuf = Buffer.from(out, 'utf8');
  const saving = 1 - outBuf.length / srcBuf.length;
  if (saving < s.minSaving) return { buffer: srcBuf, action: 'copied', reason: `saving ${(saving * 100).toFixed(1)}% < ${s.minSaving * 100}%` };

  const before = svgFacts(src), after = svgFacts(out);
  for (const k of ['viewBox', 'width', 'height']) {
    if (before[k] !== after[k]) return { buffer: srcBuf, action: 'copied', reason: `structure check failed: ${k} changed` };
  }
  for (const t of SVG_COUNTED) {
    // SVGO may legitimately inline single-use <use>; every other element type must survive.
    if (t === 'use') continue;
    if (before.counts[t] !== after.counts[t]) return { buffer: srcBuf, action: 'copied', reason: `structure check failed: <${t}> ${before.counts[t]}→${after.counts[t]}` };
  }
  const dangling = [...after.refs].filter((id) => !after.ids.has(id));
  if (dangling.length) return { buffer: srcBuf, action: 'copied', reason: `structure check failed: missing ids ${dangling.join(', ')}` };

  const { renderWidth, pixelTolerance, maxDifferentPixels, maxMeanError } = s.compare;
  const vbWidth = Number((before.viewBox ?? before.width ?? '').split(' ')[2] ?? before.width) || renderWidth;
  const density = Math.min(2400, Math.max(1, (72 * renderWidth) / vbWidth));
  const a = await rawRGBA(srcBuf, { width: renderWidth, density });
  const b = await rawRGBA(outBuf, { width: renderWidth, height: a.info.height, density });
  const { mean, differing } = diff(a.data, b.data, pixelTolerance);
  if (mean > maxMeanError || differing > maxDifferentPixels) {
    return { buffer: srcBuf, action: 'copied', reason: `render check failed: mean ${mean.toFixed(3)}, differing ${(differing * 100).toFixed(3)}%` };
  }
  return { buffer: outBuf, action: 'optimized', reason: `SVGO ${TOOLS.svgo}, saving ${(saving * 100).toFixed(1)}%, render mean ${mean.toFixed(3)}, differing ${(differing * 100).toFixed(3)}%` };
}

/* ---------- runtime map ---------- */

// Compact map for the site (srcset): public path of each raster base →
// its size and every available width, smallest first.
function runtimeMap(files) {
  const prefix = config.publicPrefix.replace(/\/$/, '');
  const map = {};
  for (const [outRel, e] of Object.entries(files)) {
    if (!e.width) continue; // SVG
    const widths = [...Object.keys(e.variants ?? {}).map(Number), e.width].sort((a, b) => a - b);
    map[`${prefix}/${outRel}`] = { height: e.height, width: e.width, widths };
  }
  return stableJson(map);
}

/* ---------- content references ---------- */

async function collectRefs() {
  const refs = []; // { ref, where }
  for (const entry of config.content) {
    const full = path.join(ROOT, entry);
    const files = (await fs.stat(full)).isDirectory() ? await walk(full) : [full];
    for (const file of files) {
      const text = await fs.readFile(file, 'utf8');
      const where = rel(file);
      if (file.endsWith('.json')) {
        const data = JSON.parse(text);
        for (const p of Array.isArray(data) ? data : Object.values(data)) {
          for (const key of ['hero', 'heroMobile', 'thumbnail']) {
            if (typeof p?.[key] === 'string' && p[key]) refs.push({ ref: p[key], where: `${where} (${p.slug ?? '?'}.${key})` });
          }
        }
      } else if (file.endsWith('.md')) {
        for (const m of text.matchAll(/!\[[^\]]*\]\(\s*(\S+)(?:\s+"([^"]*)")?\s*\)/g)) {
          refs.push({ ref: m[1], where });
          for (const p of (m[2] ?? '').matchAll(/(?:^|\s)poster=(\S+)/g)) refs.push({ ref: p[1], where: `${where} (poster)` });
        }
        for (const m of text.matchAll(/\s(?:src|poster|data-poster)="([^"]+)"/g)) refs.push({ ref: m[1], where });
      }
    }
  }
  return refs;
}

/* ---------- check (read-only) ---------- */

async function check() {
  const errors = [], warnings = [];
  if (!existsSync(SRC_DIR)) errors.push(`${config.sourceDir}/ not found at the project root: sources can't be verified`);
  const manifest = await readManifest();
  const prefix = config.publicPrefix.replace(/\/$/, '') + '/';

  // 1. Content references
  const refs = await collectRefs();
  const referenced = new Set();
  for (const { ref, where } of refs) {
    if (/^(https?:)?\/\//.test(ref)) continue;
    const clean = ref.replace(/[#?].*$/, '');
    if (!clean.startsWith(prefix)) { errors.push(`${where}: "${ref}" does not start with ${prefix}`); continue; }
    const file = path.join(PUBLIC_DIR, clean);
    const r = path.relative(OUT_DIR, file).split(path.sep).join('/');
    referenced.add(r);
    // The variants of a referenced base are used through srcset
    for (const v of Object.values(manifest.files[r]?.variants ?? {})) referenced.add(v.file);
    if (!existsSync(file)) errors.push(`${where}: "${ref}" → ${rel(file)} does not exist`);
  }

  // 2. Manifest outputs and sources
  for (const [outRel, e] of Object.entries(manifest.files)) {
    const out = path.join(OUT_DIR, outRel), src = path.join(ROOT, e.source);
    if (!existsSync(out)) errors.push(`manifest: output ${rel(out)} is missing (run npm run media)`);
    else if (sha256(await fs.readFile(out)) !== e.outputHash) errors.push(`manifest: ${rel(out)} was modified by hand (generated file)`);
    for (const v of Object.values(e.variants ?? {})) {
      const vf = path.join(OUT_DIR, v.file);
      if (!existsSync(vf)) errors.push(`manifest: variant ${rel(vf)} is missing (run npm run media)`);
      else if (sha256(await fs.readFile(vf)) !== v.hash) errors.push(`manifest: ${rel(vf)} was modified by hand (generated file)`);
    }
    if (!existsSync(src)) errors.push(`manifest: source ${e.source} was removed (run npm run media to clean up)`);
    else {
      if (sha256(await fs.readFile(src)) !== e.sourceHash) errors.push(`stale: ${e.source} changed since last run (run npm run media)`);
      const s = settingsFor(e.source);
      if (s && sha256(stableJson(s)) !== e.settingsHash) errors.push(`stale: settings/tools changed for ${e.source} (run npm run media)`);
    }
  }

  // 3. Sources not yet processed
  const bySource = new Set(Object.values(manifest.files).map((e) => e.source));
  for (const src of await walk(SRC_DIR)) {
    const r = rel(src);
    if (!settingsFor(r)) continue;
    if (!bySource.has(r)) errors.push(`pending: ${r} has not been processed (run npm run media)`);
  }

  // 4. Runtime map in sync with the manifest
  if (RUNTIME_MAP_PATH) {
    const current = existsSync(RUNTIME_MAP_PATH) ? await fs.readFile(RUNTIME_MAP_PATH, 'utf8') : null;
    if (current !== runtimeMap(manifest.files)) errors.push(`stale: ${config.runtimeMap} does not match the manifest (run npm run media)`);
  }

  // 5. Files in public/media that nobody references
  const generated = new Set(Object.entries(manifest.files).flatMap(([r, e]) => [r, ...Object.values(e.variants ?? {}).map((v) => v.file)]));
  for (const out of await walk(OUT_DIR)) {
    const r = path.relative(OUT_DIR, out).split(path.sep).join('/');
    if (!referenced.has(r)) warnings.push(`unreferenced: ${rel(out)}${generated.has(r) ? ' (generated)' : ' (manual)'}`);
  }

  warnings.forEach((w) => console.log(`warn  ${w}`));
  errors.forEach((e) => console.log(`ERROR ${e}`));
  console.log(`\nmedia:check — ${refs.length} references, ${generated.size} generated files, ${errors.length} errors, ${warnings.length} warnings`);
  process.exitCode = errors.length ? 1 : 0;
}

/* ---------- run ---------- */

async function saveManifest(files) {
  const next = stableJson({ files });
  const current = existsSync(MANIFEST_PATH) ? await fs.readFile(MANIFEST_PATH, 'utf8') : null;
  if (next === current) return false;
  await fs.writeFile(MANIFEST_PATH, next);
  return true;
}

async function saveRuntimeMap(files) {
  if (!RUNTIME_MAP_PATH) return false;
  const next = runtimeMap(files);
  const current = existsSync(RUNTIME_MAP_PATH) ? await fs.readFile(RUNTIME_MAP_PATH, 'utf8') : null;
  if (next === current) return false;
  await fs.mkdir(path.dirname(RUNTIME_MAP_PATH), { recursive: true });
  await fs.writeFile(RUNTIME_MAP_PATH, next);
  return true;
}

async function writeAtomic(out, buffer) {
  assertInside(OUT_DIR, out);
  await fs.mkdir(path.dirname(out), { recursive: true });
  const tmp = `${out}.tmp-${process.pid}`;
  await fs.writeFile(tmp, buffer);
  await fs.rename(tmp, out);
}

// Deletes a generated file only if it is still exactly what the script wrote
async function removeGenerated(outRel, hash) {
  const out = path.join(OUT_DIR, outRel);
  assertInside(OUT_DIR, out);
  if (!existsSync(out)) return true;
  if (sha256(await fs.readFile(out)) !== hash) { console.log(`keep      ${rel(out)} (no longer generated, but it was edited by hand)`); return false; }
  await fs.unlink(out);
  return true;
}

async function run() {
  const rSrc = path.relative(SRC_DIR, OUT_DIR), rOut = path.relative(OUT_DIR, SRC_DIR);
  if (!rSrc.startsWith('..') || !rOut.startsWith('..')) throw new Error('sourceDir and outputDir must not contain each other');

  if (!existsSync(SRC_DIR)) {
    throw new Error(`${config.sourceDir}/ not found at the project root (${ROOT}). Nothing was written.`);
  }
  const manifest = await readManifest();
  const files = { ...manifest.files };
  const stats = { optimized: 0, copied: 0, unchanged: 0, skipped: 0, removed: 0, bytesIn: 0, bytesOut: 0 };
  const sources = await walk(SRC_DIR);
  const liveSources = new Set();
  const ownedBy = {}; // output path → source, to catch two sources with the same output

  // Pass 1: plan everything and stop before writing if any output would
  // overwrite a manual or hand-edited file.
  const jobs = [], conflicts = [];
  for (const src of sources) {
    const srcRel = rel(src);
    const s = settingsFor(srcRel);
    if (!s) { console.log(`skip      ${srcRel} (not published: kept as source only)`); stats.skipped++; continue; }
    liveSources.add(srcRel);

    const outRel = baseOutRel(srcRel, s);
    const out = path.join(OUT_DIR, outRel);
    assertInside(OUT_DIR, out);

    const srcBuf = await fs.readFile(src);
    const sourceHash = sha256(srcBuf);
    const settingsHash = sha256(stableJson(s));
    const prev = files[outRel];

    // Every output this source will write: the base and, for rasters, its variants
    const planned = [outRel];
    if (s.kind === 'raster') planned.push(...(await plannedWidths(srcBuf, s)).variants.map((w) => variantRel(outRel, w)));

    for (const r of planned) {
      if (ownedBy[r]) { conflicts.push(`${ownedBy[r]} and ${srcRel} both produce ${config.outputDir}/${r} (rename one of them)`); continue; }
      ownedBy[r] = srcRel;
      const file = path.join(OUT_DIR, r);
      if (!existsSync(file)) continue;
      const known = r === outRel ? prev?.outputHash : Object.values(prev?.variants ?? {}).find((v) => v.file === r)?.hash;
      const hash = sha256(await fs.readFile(file));
      if (!prev || (known === undefined && prev.source !== srcRel)) conflicts.push(`${rel(file)} exists but was not generated by this script (manual file)`);
      else if (known !== undefined && known !== hash) conflicts.push(`${rel(file)} was modified by hand`);
    }

    const allOutputsIntact = prev && existsSync(out) && sha256(await fs.readFile(out)) === prev.outputHash
      && (await Promise.all(Object.values(prev.variants ?? {}).map(async (v) => existsSync(path.join(OUT_DIR, v.file)) && sha256(await fs.readFile(path.join(OUT_DIR, v.file))) === v.hash))).every(Boolean);
    if (allOutputsIntact && prev.source === srcRel && prev.sourceHash === sourceHash && prev.settingsHash === settingsHash) {
      stats.unchanged++; stats.bytesIn += prev.bytesIn; stats.bytesOut += prev.bytesOut;
      continue;
    }
    jobs.push({ s, srcRel, srcBuf, sourceHash, settingsHash, outRel, out });
  }
  if (conflicts.length) {
    throw new Error(`Nothing was written. Resolve first (rename the source, or move/restore the file):\n  - ${conflicts.join('\n  - ')}`);
  }

  let wrote = false;

  // Pass 2: process. The manifest is saved even if a file fails halfway,
  // so every output already written stays recorded as generated.
  try {
    for (const { s, srcRel, srcBuf, sourceHash, settingsHash, outRel, out } of jobs) {
      const prev = files[outRel];
      let entry;

      if (s.kind === 'raster') {
        const result = await processRaster(srcBuf, s);
        const [base, ...rest] = result.outputs;
        await writeAtomic(out, base.buffer);
        const variants = {};
        for (const v of rest) {
          const vRel = variantRel(outRel, v.width);
          await writeAtomic(path.join(OUT_DIR, vRel), v.buffer);
          variants[v.width] = { bytes: v.buffer.length, file: vRel, hash: sha256(v.buffer) };
        }
        // Variants from a previous run that are no longer generated
        for (const old of Object.values(prev?.variants ?? {})) {
          if (!Object.values(variants).some((v) => v.file === old.file)) await removeGenerated(old.file, old.hash);
        }
        const bytesOut = result.outputs.reduce((n, o) => n + o.buffer.length, 0);
        entry = {
          action: result.action, bytesIn: srcBuf.length, bytesOut, height: base.height,
          outputHash: sha256(base.buffer), reason: result.reason, settingsHash, source: srcRel, sourceHash,
          variants, width: base.width,
        };
        console.log(`${result.action.padEnd(10)}${srcRel}  ${kb(srcBuf.length)} → ${kb(base.buffer.length)} (+${kb(bytesOut - base.buffer.length)} in variants)  (${result.reason})`);
      } else {
        const result = await processSvg(srcBuf, s);
        await writeAtomic(out, result.buffer);
        entry = {
          action: result.action, bytesIn: srcBuf.length, bytesOut: result.buffer.length,
          outputHash: sha256(result.buffer), reason: result.reason, settingsHash, source: srcRel, sourceHash,
        };
        console.log(`${result.action.padEnd(10)}${srcRel}  ${kb(srcBuf.length)} → ${kb(result.buffer.length)}  (${result.reason})`);
      }

      files[outRel] = entry;
      stats[entry.action]++; stats.bytesIn += entry.bytesIn; stats.bytesOut += entry.bytesOut;
    }
  } finally {
    wrote = await saveManifest(files);
  }

  // Remove generated outputs whose source is gone (only if untouched since generation).
  for (const [outRel, e] of Object.entries(files)) {
    if (liveSources.has(e.source) && existsSync(path.join(ROOT, e.source)) && baseOutRel(e.source, settingsFor(e.source)) === outRel) continue;
    const baseGone = await removeGenerated(outRel, e.outputHash);
    for (const v of Object.values(e.variants ?? {})) await removeGenerated(v.file, v.hash);
    if (!baseGone) continue;
    delete files[outRel];
    stats.removed++;
    console.log(`removed   ${config.outputDir}/${outRel}${e.variants ? ' and its variants' : ''} (source ${e.source} no longer exists)`);
  }

  const changed = (await saveManifest(files)) || wrote;
  const mapChanged = await saveRuntimeMap(files);

  console.log(`\nmedia — optimized ${stats.optimized}, copied ${stats.copied}, unchanged ${stats.unchanged}, removed ${stats.removed}, skipped ${stats.skipped}`);
  console.log(`        generated set: ${kb(stats.bytesIn)} → ${kb(stats.bytesOut)}${changed ? '' : ' (manifest unchanged)'}${mapChanged ? `; ${config.runtimeMap} updated` : ''}`);
}

try {
  await (CHECK ? check() : run());
} catch (err) {
  console.error(`\n${err.message}`);
  process.exitCode = 1;
}