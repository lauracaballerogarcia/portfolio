/**
 * archive.js — Archive page
 *
 * Tag filters (multiple selection), list/grid view, and a preview of
 * the hero image that follows the cursor in the list view.
 */

import { fetchProjects, getUniqueTags, hasCaseStudy, getThumbnail, responsiveAttrs, srcsetFor } from '../../data/projects.js';

const DEFAULT_VIEW = 'list';

const state = {
  projects: [],
  activeTags: new Set(), // empty = All
  view: DEFAULT_VIEW,
};

const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');

// ─── Filtering ────────────────────────────────────

function getVisibleProjects() {
  if (state.activeTags.size === 0) return state.projects;
  return state.projects.filter(p =>
    p.tags.some(tag => state.activeTags.has(tag))
  );
}

// ─── Filters ──────────────────────────────────────

function renderFilters(tags) {
  const container = document.getElementById('archive-filters');
  if (!container) return;

  container.innerHTML = [
    `<button type="button" class="button-primary archive__filter archive__filter--all" data-tag="all" aria-pressed="true">All</button>`,
    ...tags.map(tag =>
      `<button type="button" class="button-primary archive__filter" data-tag="${tag}" aria-pressed="false">${tag}</button>`
    ),
  ].join('');

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tag]');
    if (!btn) return;

    const { tag } = btn.dataset;

    if (tag === 'all') state.activeTags.clear();
    else if (state.activeTags.has(tag)) state.activeTags.delete(tag);
    else state.activeTags.add(tag);

    syncFilterButtons();
    renderProjects();
  });
}

function syncFilterButtons() {
  document.querySelectorAll('#archive-filters [data-tag]').forEach(btn => {
    const { tag } = btn.dataset;
    const pressed = tag === 'all'
      ? state.activeTags.size === 0
      : state.activeTags.has(tag);
    btn.setAttribute('aria-pressed', String(pressed));
  });
}

// ─── View switch ──────────────────────────────────

function initViewToggle() {
  const buttons = document.querySelectorAll('button[data-view]');

  buttons.forEach(btn => {
    btn.setAttribute('aria-pressed', String(btn.dataset.view === state.view));

    btn.addEventListener('click', () => {
      if (state.view === btn.dataset.view) return;
      state.view = btn.dataset.view;
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      hidePreview();
      renderProjects();
    });
  });
}

// ─── Render ───────────────────────────────────────

// sizes of the grid cards: 3 columns from 1025px (496px at most inside
// .container), 2 from 769px and 1 below (archive.css). The cursor preview
// is 28.25rem wide (cursor-preview.css). Approximate on purpose.
const CARD_SIZES = '(min-width: 1568px) 496px, (min-width: 1025px) calc(33.33vw - 27px), (min-width: 769px) calc(50vw - 32px), calc(100vw - 48px)';
const PREVIEW_SIZES = '28.25rem';

// Projects without a case study: same row/card, but without a link
function listItem(p) {
  const available = hasCaseStudy(p.slug);
  const tag = available ? 'a' : 'div';
  const href = available ? ` href="/project/${p.slug}/"` : '';
  return `
    <li>
      <${tag} class="archive-row${available ? '' : ' archive-row--coming-soon'}"${href} data-thumbnail="${getThumbnail(p)}" data-srcset="${srcsetFor(getThumbnail(p))?.srcset ?? ''}">
        <h2 class="archive-row__title">${p.title}</h2>
        <p class="archive-row__claim">${p.claim ?? p.summary}${available ? '' : '<span class="visually-hidden"> (case study coming soon)</span>'}</p>
        <time class="archive-row__year" datetime="${p.year}">${p.year}</time>
      </${tag}>
    </li>
  `;
}

function gridItem(p) {
  const available = hasCaseStudy(p.slug);
  const chipText  = available ? 'See work' : 'Coming soon!';

  const tag = available ? 'a' : 'div';
  const href = available ? ` href="/project/${p.slug}/"` : '';

  return `
    <li>
      <${tag} class="archive-card${available ? '' : ' archive-card--coming-soon'}"${href}>
        <figure class="archive-card__figure">
          <img class="archive-card__image" ${responsiveAttrs(getThumbnail(p), CARD_SIZES)} alt="" loading="lazy" decoding="async">
          <span class="chip${available ? '' : ' chip--coming-soon'}"${available ? ' aria-hidden="true"' : ''}>
            <span class="chip__label">${chipText}</span>
          </span>
        </figure>
        <h2 class="archive-card__title">${p.title}</h2>
        <p class="archive-card__tags">${p.tags.join(', ')}</p>
      </${tag}>
    </li>
  `;
}

function renderProjects() {
  const list = document.getElementById('archive-projects');
  const status = document.getElementById('archive-status');
  if (!list) return;

  const visible = getVisibleProjects();
  const template = state.view === 'grid' ? gridItem : listItem;

  list.dataset.view = state.view;
  list.innerHTML = visible.length
    ? visible.map(template).join('')
    : `<li class="archive__empty">No projects match these filters.</li>`;

  if (status) {
    status.textContent = `${visible.length} ${visible.length === 1 ? 'project' : 'projects'}`;
  }
}

// ─── Cursor preview (list view) ───────────────────
// The coordinates go in custom properties (--x, --y): it is the only style
// written from JS, because it depends on the pointer position.

let previewEl = null;
let previewImg = null;

function hidePreview() {
  previewEl?.classList.remove('is-visible');
}

function initCursorPreview() {
  previewEl = document.querySelector('.cursor-preview');
  previewImg = previewEl?.querySelector('.cursor-preview__image');
  const list = document.getElementById('archive-projects');
  if (!previewEl || !previewImg || !list) return;

  let x = 0;
  let y = 0;
  let frame = null;

  /** Places the preview next to the cursor (cursor-preview.css reads the position) */
  function positionPreview() {
    previewEl.style.setProperty('--x', `${x}px`);
    previewEl.style.setProperty('--y', `${y}px`);
  }

  list.addEventListener('mouseover', (e) => {
    if (state.view !== 'list' || !canHover.matches) return;
    const row = e.target.closest('[data-thumbnail]');
    if (!row) return;

    // Positions it before showing it, so it does not appear in the previous spot
    x = e.clientX;
    y = e.clientY;
    positionPreview();

    // srcset first, so the browser picks the preview width before loading
    if (previewImg.getAttribute('src') !== row.dataset.thumbnail) {
      previewImg.sizes = PREVIEW_SIZES;
      previewImg.srcset = row.dataset.srcset;
      previewImg.src = row.dataset.thumbnail;
    }
    previewEl.classList.add('is-visible');
  });

  list.addEventListener('mousemove', (e) => {
    if (state.view !== 'list') return;
    x = e.clientX;
    y = e.clientY;

    if (frame) return;
    frame = requestAnimationFrame(() => {
      positionPreview();
      frame = null;
    });
  });

  list.addEventListener('mouseleave', hidePreview);
}

// ─── Init ─────────────────────────────────────────

export async function initArchive() {
  try {
    const projects = await fetchProjects();
    state.projects = [...projects].sort((a, b) => Number(b.year) - Number(a.year));

    renderFilters(getUniqueTags(projects));
    initViewToggle();
    initCursorPreview();
    renderProjects();
  } catch (err) {
    console.error(err);
    const list = document.getElementById('archive-projects');
    if (list) list.innerHTML = `<li class="archive__empty" role="alert">Projects could not be loaded.</li>`;
  }
}