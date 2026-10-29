/**
 * about.js — About page
 *
 * All the content lives in src/data/about.json: an object with one profile
 * per key (professional, personal…). A null profile does not exist yet and
 * is not shown. With more than one profile the selector is rendered;
 * switching profile renders the photo, intro, sections and index again.
 */

import aboutData from '../../data/about.json';
import { marked } from 'marked';

// "2025-05" → "May 2025". The CSS sets the capitals.
const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });

// The content is ours, but it is escaped anyway: a "<" or an "&" in the
// JSON must not break the markup
function escapeHTML(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(value) {
  if (!value) return 'Present';
  const [year, month] = value.split('-').map(Number);
  return `<time datetime="${value}">${dateFormat.format(Date.UTC(year, month - 1))}</time>`;
}

// ─── Sections: one function per type ──────────────

function renderTimelineItem(item) {
  const { name, url } = item.organization ?? {};
  const organization = url
    ? `<a class="about-item__link" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(name)}</a>`
    : escapeHTML(name);
  const location = item.location ? ` · ${escapeHTML(item.location)}` : '';

  return `
    <li class="about-section__item">
      <details class="about-item">
        <summary class="about-item__summary">
          <span class="about-item__role">${escapeHTML(item.role)}</span>
          <span class="about-item__dates">${formatDate(item.start)} – ${formatDate(item.end)}</span>
          <span class="about-item__icon" aria-hidden="true"></span>
        </summary>
        ${name ? `<p class="about-item__organization">${organization}${location}</p>` : ''}
        ${item.description ? `<p class="about-item__description">${escapeHTML(item.description)}</p>` : ''}
      </details>
    </li>
  `;
}

function renderListItem(item) {
  return `<li class="about-section__item about-entry"><span class="about-entry__name">${escapeHTML(item)}</span></li>`;
}

function renderLanguageItem(item) {
  return `
    <li class="about-section__item about-entry">
      <span class="about-entry__name">${escapeHTML(item.language)}</span>
      <span class="about-entry__level">${escapeHTML(item.level)}</span>
      ${item.note ? `<span class="about-entry__note">${escapeHTML(item.note)}</span>` : ''}
    </li>
  `;
}

const itemRenderers = {
  timeline:  renderTimelineItem,
  list:      renderListItem,
  languages: renderLanguageItem,
};

function renderSection(section) {
  const renderItem = itemRenderers[section.type];
  if (!renderItem || !section.items?.length) return '';

  // role="list": Safari stops announcing a ul without bullets as a list
  return `
    <section class="about-section" id="${escapeHTML(section.id)}" aria-labelledby="${escapeHTML(section.id)}-title">
      <h2 class="about-section__title" id="${escapeHTML(section.id)}-title">${escapeHTML(section.title)}</h2>
      <ul class="about-section__list" role="list">
        ${section.items.map(renderItem).join('')}
      </ul>
    </section>
  `;
}

// ─── Side index ────────────────────────────────────

// Marks the link of the visible section. Same rule as the case study
// index: the active section is the last one whose title has passed a line
// at ~35% of the window height. It reads the DOM on every call, so it
// works for any profile without registering the listener again.
function updateActiveLink() {
  const links   = document.querySelectorAll('#about-index .section-index__link');
  const headers = document.querySelectorAll('.about-section__title');

  const headerEl     = document.querySelector('.site-nav');
  const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 64;
  const triggerLine  = headerHeight + window.innerHeight * 0.35;

  let current = headers[0]?.closest('section')?.id ?? null;
  headers.forEach(h => {
    if (h.getBoundingClientRect().top <= triggerLine) current = h.closest('section').id;
  });

  // At the end of the page the last (short) section never reaches the
  // line: if the page cannot scroll further, it is the active one
  const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1;
  if (atEnd && headers.length) current = headers[headers.length - 1].closest('section').id;

  links.forEach(link => {
    if (link.getAttribute('href') === `#${current}`) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
}

function renderIndex(sections) {
  const indexNav = document.getElementById('about-index');
  if (!indexNav) return;

  // The same sections that are rendered: no items, no section and no link
  const visible = sections.filter(s => itemRenderers[s.type] && s.items?.length);

  indexNav.innerHTML = `
    <ul class="section-index__list">
      ${visible.map(s => `
        <li class="section-index__item">
          <a href="#${escapeHTML(s.id)}" class="section-index__link">${escapeHTML(s.title)}</a>
        </li>
      `).join('')}
    </ul>
  `;
  updateActiveLink();
}

// ─── Profile ───────────────────────────────────────

function renderProfile(profile) {
  const image = document.getElementById('about-image');
  if (image) {
    image.innerHTML = profile.image?.src
      ? `<img class="about__image" src="${escapeHTML(profile.image.src)}" alt="${escapeHTML(profile.image.alt)}" decoding="async">`
      : '';
  }

  const intro = document.getElementById('about-intro');
  if (intro) {
    // parseInline: bold, italics and links only; no extra <p>
    intro.innerHTML = (profile.intro ?? []).map(p => `<p class="about__text">${marked.parseInline(p)}</p>`).join('');
  }

  const sections = profile.sections ?? [];
  const container = document.getElementById('about-sections');
  if (container) container.innerHTML = sections.map(renderSection).join('');

  renderIndex(sections);
}

// ─── Profile selector ──────────────────────────────

function renderSelector(profiles) {
  const group = document.getElementById('about-profiles');
  if (!group || profiles.length < 2) return;

  group.innerHTML = profiles.map(([key, profile], i) => `
    <button type="button" class="button-primary" data-profile="${escapeHTML(key)}" aria-pressed="${i === 0}">
      ${escapeHTML(profile.label)}
    </button>
  `).join('');
  group.hidden = false;

  // The buttons are not rendered again when the profile changes: focus
  // stays on the pressed button and aria-pressed tells which one is active
  group.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-profile]');
    if (!btn || btn.getAttribute('aria-pressed') === 'true') return;

    group.querySelectorAll('[data-profile]').forEach(b => {
      b.setAttribute('aria-pressed', String(b === btn));
    });
    renderProfile(aboutData[btn.dataset.profile]);
  });
}

/** Exports the init function for the router */
export function initAbout() {
  const profiles = Object.entries(aboutData).filter(([, profile]) => profile);
  if (!profiles.length) return;

  renderSelector(profiles);
  renderProfile(profiles[0][1]);

  window.addEventListener('scroll', updateActiveLink, { passive: true });
}
