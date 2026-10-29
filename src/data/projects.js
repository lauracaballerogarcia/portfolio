import projectsData from './projects.json';
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

// The image title in Markdown carries the layout and the intrinsic size
// of the file: ![alt](path "full 1440x960"). With width and height the
// browser reserves the space before the file loads, so the text does not
// jump while scrolling. Videos can add
// poster=/media/<project>/<video>-poster.webp: ![alt](path "full 1440x900 poster=…").
function parseImageTitle(title) {
  const parts  = (title ?? '').trim().split(/\s+/).filter(Boolean);
  const size   = parts.find(p => /^\d+x\d+$/.test(p));
  const poster = parts.find(p => p.startsWith('poster='))?.slice('poster='.length);
  const mod    = parts.find(p => p !== size && !p.startsWith('poster=')) ?? 'default';
  const [width, height] = size ? size.split('x') : [];
  return { mod, poster, dims: size ? ` width="${width}" height="${height}"` : '' };
}

renderer.image = ({ href, title, text }) => {
  const { mod, dims, poster } = parseImageTitle(title);

  // Looping video with no playback bar. Nothing downloads, not even the
  // poster (it goes in data-poster), until initLoopVideos() (case.js) brings
  // it near the viewport. The #t=0.001 fragment makes Safari/iOS paint the
  // first frame when only the metadata loads (reduced motion).
  if (/\.(mp4|webm)$/i.test(href)) {
    const type = href.toLowerCase().endsWith('.webm') ? 'video/webm' : 'video/mp4';
    return `
      <figure class="case-figure case-figure--${mod} case-figure--video">
        <div class="case-figure__video">
          <video class="case-figure__player" muted loop playsinline preload="none"${dims}${poster ? ` data-poster="${poster}"` : ''} aria-label="${text}">
            <source src="${href}#t=0.001" type="${type}">
          </video>
        </div>
      </figure>
    `;
  }

  return `
    <figure class="case-figure case-figure--${mod}">
      <picture class="case-figure__frame">
        <img
          class="case-figure__image"
          src="${href}"
          alt="${text}"${dims}
          loading="lazy"
          decoding="async">
      </picture>
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
      const figures = paragraphs.map(p => this.parser.parseInline(p.tokens)).join('');
      return `<div class="case-section__media">${figures}</div>\n`;
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

export async function fetchProjects() {
  return projectsData;
}

export async function fetchProjectContent(slug) {
  const md = contentMap[slug];
  if (!md) throw new Error(`No se encontró el contenido: ${slug}`);
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