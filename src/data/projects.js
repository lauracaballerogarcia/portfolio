import projectsData from './projects.json';
import mediaVariants from './media-variants.json';
import { Marked } from 'marked';

import sendaMd from 'bundle-text:./content/senda.md';
import parcCentralMd from 'bundle-text:./content/parc-central.md';
import xanaMd from 'bundle-text:./content/xana.md';
import blinkMd from 'bundle-text:./content/blink.md';


// ─── Content map ──────────────────────────────────

const contentMap = {
  'senda': sendaMd,
  'parc-central': parcCentralMd,
  'xana': xanaMd,
  'blink': blinkMd
};

// ─── Case study renderer ───────────────────────────
//
// Its own Marked instance: the case study BEM classes do not affect the
// global marked that about.js uses (marked.parseInline in the intro).
// Every element gets its .case-section class (case-section.css), so the
// styles do not depend on descendant selectors.

const caseMarked = new Marked();
const renderer = new caseMarked.Renderer();

const HEADING_CLASS = {
  2: 'case-section__title',
  3: 'case-section__subtitle',
  4: 'case-section__subheading',
};

renderer.heading = function ({ tokens, text, depth }) {
  const id = text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
  const cls = HEADING_CLASS[depth] ? ` class="${HEADING_CLASS[depth]}"` : '';
  return `<h${depth}${cls} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
};

renderer.paragraph = function ({ tokens }) {
  return `<p class="case-section__text">${this.parser.parseInline(tokens)}</p>\n`;
};

renderer.list = function (token) {
  const tag = token.ordered ? 'ol' : 'ul';
  const mod = token.ordered ? ' case-section__list--ordered' : '';
  const start = token.ordered && token.start !== 1 ? ` start="${token.start}"` : '';
  const items = token.items.map(item => this.listitem(item)).join('');
  return `<${tag} class="case-section__list${mod}"${start}>\n${items}</${tag}>\n`;
};

renderer.listitem = function (item) {
  return `<li class="case-section__item">${this.parser.parse(item.tokens, !!item.loose)}</li>\n`;
};

renderer.strong = function ({ tokens }) {
  return `<strong class="case-section__strong">${this.parser.parseInline(tokens)}</strong>`;
};

// Figures have no enlarge button (lightbox) by default. `expand` adds it,
// for media with text that needs to be read: ![alt](path "full expand").
// `carousel` puts the figure in a horizontal carousel together with the
// images around it that also carry it: ![alt](path "carousel").
// Everything after the first `|` is the visible caption, with inline
// Markdown: ![alt](path "full expand | Heatmaps from the *Maze* test.").
// Without `|`, the figure has no caption.
const FLAGS = ['expand', 'carousel'];

function parseImageTitle(title) {
  const raw      = title ?? '';
  const pipe     = raw.indexOf('|');
  const flags    = pipe === -1 ? raw : raw.slice(0, pipe);
  const caption  = pipe === -1 ? '' : raw.slice(pipe + 1).trim();
  const parts    = flags.trim().split(/\s+/).filter(Boolean);
  const size     = parts.find(p => /^\d+x\d+$/.test(p));
  const poster   = parts.find(p => p.startsWith('poster='))?.slice('poster='.length);
  const expand   = parts.includes('expand');
  const carousel = parts.includes('carousel');
  const mod      = parts.find(p => p !== size && !FLAGS.includes(p) && !p.startsWith('poster=')) ?? 'default';
  const [width, height] = size ? size.split('x') : [];
  return { mod, poster, carousel, caption, expand: expand ? ' data-expand="true"' : '', dims: size ? ` width="${width}" height="${height}"` : '' };
}

// sizes of the case study figures: how wide each layout shows them, so the
// browser picks the right width from srcset. Derived from the case grid
// (case.css): the content takes 7 of 12 columns from 1025px (880px at most),
// and below that the full width minus the page margin (24px per side).
// Approximate on purpose: the browser rounds up to the next available width.
const FIGURE_SIZES = {
  full: '(min-width: 1568px) 880px, (min-width: 1025px) calc(58.33vw - 35px), calc(100vw - 48px)',
  half: '(min-width: 1568px) 432px, (min-width: 1025px) calc(29.17vw - 28px), (min-width: 769px) calc(50vw - 32px), calc(100vw - 48px)',
  // Carousel items: two and a quarter per row from 769px, one and a
  // quarter below (case-carousel.css)
  carousel: '(min-width: 1568px) 380px, (min-width: 1025px) calc(25.9vw - 20px), (min-width: 769px) calc(44.44vw - 39px), calc(80vw - 54px)',
};
const sizesFor = (mod, carousel) => (carousel ? FIGURE_SIZES.carousel
  : ['half', 'duo', 'portrait'].includes(mod) ? FIGURE_SIZES.half : FIGURE_SIZES.full);

renderer.image = ({ href, title, text }) => {
  const { mod, dims, poster, expand, carousel, caption } = parseImageTitle(title);
  const figcaption = caption ? `
        <figcaption class="case-figure__caption">${caseMarked.parseInline(caption)}</figcaption>` : '';

  // Looping video with no playback bar. Nothing downloads, not even the
  // poster (it goes in data-poster), until initLoopVideos() (case.js) brings
  // it near the viewport. The #t=0.001 fragment makes Safari/iOS paint the
  // first frame when only the metadata loads (reduced motion).
  if (/\.(mp4|webm)$/i.test(href)) {
    const type = href.toLowerCase().endsWith('.webm') ? 'video/webm' : 'video/mp4';
    return `
       <figure class="case-figure case-figure--${mod} case-figure--video"${expand}>
        <div class="case-figure__video">
          <video class="case-figure__player" muted loop playsinline preload="none"${dims}${poster ? ` data-poster="${poster}"` : ''} aria-label="${text}">
            <source src="${href}#t=0.001" type="${type}">
          </video>
        </div>${figcaption}
      </figure>
    `;
  }

  // Images generated by the media pipeline get every width in srcset; the
  // rest (SVG, manual files) keep a single src.
  const responsive = srcsetFor(href);
  const size = dims || (responsive ? ` width="${responsive.width}" height="${responsive.height}"` : '');
  const srcset = responsive ? `
          srcset="${responsive.srcset}"
          sizes="${sizesFor(mod, carousel)}"` : '';

  return `
    <figure class="case-figure case-figure--${mod}"${expand}>
      <picture class="case-figure__frame">
        <img
          class="case-figure__image"
          src="${href}"${srcset}
          alt="${text}"${size}
          loading="lazy"
          decoding="async">
      </picture>${figcaption}
    </figure>
  `;
};

renderer.blockquote = ({ text }) => `
  <blockquote class="case-quote">${text}</blockquote>
`;

caseMarked.use({ renderer });

// ─── Media groups (.case-section__media) ───────────

// Marked wraps images in <p>, and as a <figure> cannot go inside a
// paragraph, the browser closes the <p> before the figure and leaves an
// empty <p></p> behind. Here:
// 1. A paragraph that mixes text and images is split into a text
//    paragraph and an image paragraph, in the same order.
// 2. Consecutive paragraphs with only images or videos (even if a blank
//    line separates them) join in one container, which sets the space
//    between figures with gap (case-section.css).
// Figures still come from renderer.image.

const isBlank = t => t.type === 'br' || (t.type === 'text' && !t.text.trim());

function isMediaParagraph(token) {
  if (token.type !== 'paragraph') return false;
  const inline = token.tokens ?? [];
  return inline.some(t => t.type === 'image') && inline.every(t => t.type === 'image' || isBlank(t));
}

// Splits a mixed paragraph into runs of text and runs of images
function splitMixedParagraph(token) {
  const inline = token.tokens ?? [];
  if (token.type !== 'paragraph' || isMediaParagraph(token) || !inline.some(t => t.type === 'image')) {
    return [token];
  }
  const runs = [];
  for (const t of inline) {
    const kind = t.type === 'image' ? 'media' : 'text';
    const last = runs[runs.length - 1];
    if (last && (last.kind === kind || (isBlank(t) && last.kind === 'media'))) last.tokens.push(t);
    else runs.push({ kind, tokens: [t] });
  }
  return runs
    .filter(r => r.tokens.some(t => !isBlank(t)))
    .map(r => {
      const raw = r.tokens.map(t => t.raw).join('');
      return { type: 'paragraph', raw, text: raw, tokens: r.tokens };
    });
}

caseMarked.use({
  extensions: [{
    name: 'caseMedia',
        renderer({ paragraphs }) {
      // Images marked `carousel` that follow one another become a carousel:
      // each figure in its own slide, plus the arrows that case.js wires up.
      // The rest of the group renders as usual, before or after it.
      const images = paragraphs.flatMap(p => p.tokens.filter(t => t.type === 'image'));
      const runs = [];
      for (const t of images) {
        const carousel = parseImageTitle(t.title).carousel;
        const last = runs[runs.length - 1];
        if (last && last.carousel === carousel) last.tokens.push(t);
        else runs.push({ carousel, tokens: [t] });
      }
      const html = runs.map(({ carousel, tokens }) => {
        if (!carousel) return this.parser.parseInline(tokens);
        const slides = tokens
          .map(t => `<li class="case-carousel__item">${this.parser.parseInline([t])}</li>`)
          .join('');
        return `
          <div class="case-carousel" role="region" aria-roledescription="carousel" aria-label="Image carousel">
            <ul class="case-carousel__track" role="list" tabindex="0">${slides}</ul>
            <div class="case-carousel__controls">
              <button type="button" class="icon-button case-carousel__arrow" data-scroll="prev" aria-label="Show previous image"></button>
              <button type="button" class="icon-button case-carousel__arrow" data-scroll="next" aria-label="Show next image"></button>
            </div>
          </div>`;
      }).join('');
      return `<div class="case-section__media">${html}</div>\n`;
    }
  }],
  hooks: {
    processAllTokens(tokens) {
      const flat = tokens.flatMap(splitMixedParagraph);
      const result = [];
      for (let i = 0; i < flat.length; i++) {
        if (!isMediaParagraph(flat[i])) {
          result.push(flat[i]);
          continue;
        }
        // Joins the following media paragraphs, skipping blank lines
        const paragraphs = [flat[i]];
        let next = i + 1;
        while (next < flat.length) {
          if (flat[next].type === 'space') { next++; continue; }
          if (!isMediaParagraph(flat[next])) break;
          paragraphs.push(flat[next]);
          i = next++;
        }
        result.push({ type: 'caseMedia', raw: paragraphs.map(p => p.raw).join(''), paragraphs });
      }
      return result;
    }
  }
});

// ─── Data functions ───────────────────────────────

/**
 * Responsive widths of an image generated by the media pipeline
 * (media-variants.json): the base path is the largest width and every
 * other width lives next to it as name-<w>w.webp. Returns null for
 * images without variants (SVG, manual files), which keep a single src.
 */
export function srcsetFor(src) {
  const entry = mediaVariants[src];
  if (!entry) return null;
  const srcset = entry.widths
    .map(w => `${w === entry.width ? src : src.replace(/\.webp$/i, `-${w}w.webp`)} ${w}w`)
    .join(', ');
  return { srcset, width: entry.width, height: entry.height };
}

/**
 * Attributes for an <img> (or <source>) that should pick its width:
 * src, plus srcset, sizes, width and height when the pipeline generated
 * variants. `sizes` says how wide the layout shows the image; each page
 * declares its own next to its layout.
 */
export function responsiveAttrs(src, sizes) {
  const r = srcsetFor(src);
  if (!r) return `src="${src}"`;
  return `src="${src}" srcset="${r.srcset}" sizes="${sizes}" width="${r.width}" height="${r.height}"`;
}

/** The same for a <picture> <source>, which takes srcset instead of src. */
export function responsiveSourceAttrs(src, sizes) {
  const r = srcsetFor(src);
  if (!r) return `srcset="${src}"`;
  return `srcset="${r.srcset}" sizes="${sizes}" width="${r.width}" height="${r.height}"`;
}

export async function fetchProjects() {
  return projectsData;
}

export async function fetchProjectContent(slug) {
  const md = contentMap[slug];
  if (!md) throw new Error(`Content not found: ${slug}`);
  return caseMarked.parse(md);
}

export function getUniqueTags(projects) {
  const all = projects.flatMap(p => p.tags);
  return [...new Set(all)].sort();
}

export function hasCaseStudy(slug) {
  return slug in contentMap;
}

export function getThumbnail(project) {
  return project.thumbnail ?? project.hero;
}

// When to use heroMobile (vertical crop) instead of the hero or the
// thumbnail: narrow portrait screens, below 768px and at most 3:4 (the
// same condition as the PEC1). Portrait tablets (e.g. 768×1024) keep the
// horizontal hero, which gives more resolution in their wider box.
export const HERO_MOBILE_MEDIA = '(max-width: 767.98px) and (max-aspect-ratio: 3/4)';