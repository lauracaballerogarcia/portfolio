/**
 * case.js — Case study page (URL /project/<slug>/)
 *
 * Reads the slug from the URL, loads the projects JSON and the case
 * study Markdown, and fills the DOM.
 */

import { fetchProjects, fetchProjectContent, hasCaseStudy, getThumbnail, HERO_MOBILE_MEDIA, srcsetFor, responsiveAttrs } from '../../data/projects.js';
import { initCaseLightbox } from './case-lightbox.js';


// ─── DOM utilities ─────────────────────────────────

function $(id) { return document.getElementById(id); }

function setText(id, value) {
  const el = $(id);
  if (el && value) el.textContent = value;
}

function show(id) { const el = $(id); if (el) el.hidden = false; }
function hide(id) { const el = $(id); if (el) el.hidden = true;  }

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

// ─── Slug from the URL ─────────────────────────────

function getSlugFromURL() {
  const parts = window.location.pathname
    .replace(/^\/|\/$/g, '')
    .split('/');
  return parts[1] ?? null;
}

// ─── Eyebrow before each h2 ─────────────────────────
//
// In the Markdown, the eyebrow is a <p class="case-section__eyebrow">
// written right before an h2, e.g. "Research" before "## We assumed the
// problem...". It is not <strong>: the eyebrow is a category label, not
// text emphasis, so only the class is checked here, not the structure.

function getEyebrowFor(h2) {
  const prev = h2.previousElementSibling;
  return prev?.classList.contains('case-section__eyebrow') ? prev : null;
}

// ─── In-page index ─────────────────────────────────

function renderIndex() {
  const indexNav = document.querySelector('.section-index');
  if (!indexNav) return;

  // Overview lives outside the case study (in .case__main, before the
  // article), but it is the first entry of the index. querySelectorAll
  // returns elements in document order, so it comes first.
  const sections = Array.from(
    document.querySelectorAll('#overview, #case-body > .case-section')
  );
  if (!sections.length) return;

  // The index label comes from each section's eyebrow; if a section has
  // no eyebrow, it falls back to the text of the h2.
  const items = sections.map(section => {
    const eyebrow = section.querySelector(':scope > .case-section__eyebrow');
    const heading = section.querySelector(':scope > .case-section__title, :scope > h2');
    return {
      id:    section.id,
      label: (eyebrow ?? heading)?.textContent.trim() ?? '',
    };
  });

  indexNav.innerHTML = `
    <ul class="section-index__list">
      ${items.map(s => `
        <li class="section-index__item">
          <a href="#${s.id}" class="section-index__link">${s.label}</a>
        </li>
      `).join('')}
    </ul>
  `;

  // The links are native anchors: the browser moves focus to the section,
  // updates the URL and respects prefers-reduced-motion. The offset of the
  // fixed header comes from scroll-margin-top (case-section.css).

  // Marks the active link while scrolling (measured by the position of
  // the h2, as the eyebrow sits right above it).
  const links    = indexNav.querySelectorAll('.section-index__link');
  const headings = sections
    .map(section => section.querySelector(':scope > .case-section__title, :scope > h2'))
    .filter(Boolean);

  function updateActiveLink() {
    const headerEl = document.querySelector('.site-nav');
    const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 64;

    // FIX: the reference line used to sit right below the header (+32px),
    // so a section did not become "active" until its heading almost
    // touched the header. With the next section already well in view, the
    // nav still pointed at the previous one. The line moves to ~35% of the
    // window height: the change happens as soon as the new section is the
    // visible one, not when the previous one has almost gone.
    const triggerLine = window.scrollY + headerHeight + window.innerHeight * 0.35;

    let current = null;

    headings.forEach(h => {
      const top = h.getBoundingClientRect().top + window.scrollY;
      if (top <= triggerLine) current = h.closest('section')?.id ?? h.id;
    });

    links.forEach(link => {
      if (link.getAttribute('href') === `#${current}`) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();
}


// ─── Insights carousel ─────────────────────────────

function initInsightsCarousel(root = document) {
  const track = root.querySelector('.insights__track');
  const prevButton = root.querySelector('[data-scroll="prev"]');
  const nextButton = root.querySelector('[data-scroll="next"]');

  if (!track || !prevButton || !nextButton) return;

  const getStep = () => {
    const card = track.querySelector('.insight-card');
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    return card ? card.getBoundingClientRect().width + gap : track.clientWidth;
  };

  // 1px of tolerance at both ends: some browsers (Firefox) leave scrollLeft
  // at a fraction of a pixel instead of an exact 0 or end value.
  const updateArrowState = () => {
    const { scrollLeft, scrollWidth, clientWidth } = track;
    prevButton.disabled = scrollLeft <= 1;
    nextButton.disabled = scrollLeft + clientWidth >= scrollWidth - 1;
  };

  prevButton.addEventListener('click', () => {
    track.scrollBy({ left: -getStep(), behavior: 'smooth' });
  });

  nextButton.addEventListener('click', () => {
    track.scrollBy({ left: getStep(), behavior: 'smooth' });
  });

  track.addEventListener('scroll', updateArrowState, { passive: true });
  updateArrowState();

  // The carousel starts while the case study is still hidden (zero width),
  // so the arrows are measured again when the track gets its size: when the
  // page is shown and on every resize.
  if ('ResizeObserver' in window) new ResizeObserver(updateArrowState).observe(track);
}

// ── Related work ──────────────────────────────────────────────

const RELATED_LIMIT = 3;

// sizes of the related work images: on desktop with a pointer, three cards
// in columns 5 to 12 of the full-width grid; otherwise a carousel of cards
// at 75% of the width, 320px at most (related-work.css). Approximate.
const RELATED_SIZES = '(min-width: 1024px) and (hover: hover) calc(22.22vw - 23px), (min-width: 475px) 320px, calc(75vw - 36px)';

function getRelatedProjects(current, projects, limit = RELATED_LIMIT) {
  const currentTags = new Set(current.tags ?? []);

  return projects
    .filter((p) => p.slug !== current.slug && hasCaseStudy(p.slug))
    .map((p) => ({
      project: p,
      shared: (p.tags ?? []).filter((tag) => currentTags.has(tag)).length,
      year: parseInt(p.year, 10) || 0,
      tiebreak: Math.random(),
    }))
    .sort((a, b) =>
      b.shared - a.shared ||
      b.year - a.year ||
      a.tiebreak - b.tiebreak
    )
    .slice(0, limit)
    .map(({ project }) => project);
}

function renderRelatedWork(current, projects) {
  const section = document.querySelector('.related-work');
  if (!section) return;

  const related = getRelatedProjects(current, projects);
  if (related.length === 0) return;

  section.innerHTML = `
    <div class="related-work__aside">
      <h2 class="related-work__label" id="related-work-title">Related work</h2>
      <div class="related-work__info" aria-hidden="true">
        <p class="related-work__title">${related[0].title}</p>
        <p class="related-work__claim">${related[0].claim ?? ''}</p>
      </div>
    </div>
    <ul class="related-work__list" role="list">
      ${related.map((p, i) => `
        <li class="related-work__item">
          <a class="related-work__link" href="/project/${p.slug}/" data-index="${i}">
            <figure class="related-work__figure">
              <img class="related-work__image" ${responsiveAttrs(getThumbnail(p), RELATED_SIZES)} alt="" loading="lazy" decoding="async">
            </figure>
            <span class="related-work__caption">
              <span class="related-work__caption-title">${p.title}</span>
              <span class="related-work__caption-claim">${p.claim ?? ''}</span>
            </span>
          </a>
        </li>
      `).join('')}
    </ul>
  `;

  const title = section.querySelector('.related-work__title');
  const claim = section.querySelector('.related-work__claim');

  const showProject = (index) => {
    const p = related[index];
    title.textContent = p.title;
    claim.textContent = p.claim ?? '';
  };

  section.querySelectorAll('.related-work__link').forEach((link) => {
    const index = Number(link.dataset.index);
    link.addEventListener('pointerenter', () => showProject(index));
    link.addEventListener('focus', () => showProject(index));
  });

  section.hidden = false;
}

// ─── Looping videos ────────────────────────────────

function initLoopVideos(root = document) {
  const videos = root.querySelectorAll('.case-figure__player');
  if (!videos.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // The poster (data-poster) is set on approach, like the video, so they do
  // not all download on arrival. Until there is a poster or a frame, the
  // background of .case-figure__video shows, with its size reserved.
  const showPoster = (video) => {
    if (video.dataset.poster && !video.getAttribute('poster')) video.poster = video.dataset.poster;
  };

  // Loads the video the first time it nears the screen. With reduced
  // motion it only requests the metadata: the browser shows the first frame
  // as a still image and it plays on demand only. With a poster and reduced
  // motion, the poster is enough: the video waits for the button.
  const approach = (video) => {
    showPoster(video);
    if (!(reduceMotion.matches && video.dataset.poster)) load(video);
  };

  const load = (video) => {
    if (video.dataset.loaded) return;
    video.dataset.loaded = 'true';
    video.preload = reduceMotion.matches ? 'metadata' : 'auto';
    video.load();
  };

  const autoplay = (video) => {
    if (reduceMotion.matches || video.dataset.userPaused === 'true') return;
    video.play().catch(() => {});
  };

  // Two observers: one starts the download early (300px before it enters)
  // and the other plays only while the video is visible and pauses on exit.
  const supportsIO = 'IntersectionObserver' in window;
  const loadObserver = supportsIO && new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) { approach(target); loadObserver.unobserve(target); }
    });
  }, { rootMargin: '300px 0px' });

  const playObserver = supportsIO && new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) autoplay(target);
      else if (!target.paused) target.pause();
    });
  });

  videos.forEach((video) => {
    const wrapper = video.parentElement;
    if (wrapper.querySelector('.case-figure__toggle')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'icon-button icon-button--translucent case-figure__toggle';

    const sync = () => {
      const paused = video.paused;
      button.dataset.state = paused ? 'paused' : 'playing';
      button.setAttribute('aria-label', paused ? 'Play video' : 'Pause video');
    };

    // The button rules: if the user pauses, the video does not resume by itself
    button.addEventListener('click', () => {
      if (video.paused) {
        video.dataset.userPaused = 'false';
        showPoster(video);
        load(video);
        video.play().catch(() => {});
      } else {
        video.dataset.userPaused = 'true';
        video.pause();
      }
    });

    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);

    wrapper.appendChild(button);
    sync();

    if (supportsIO) {
      loadObserver.observe(video);
      playObserver.observe(video);
    } else {
      // Browsers without IntersectionObserver: previous behaviour
      approach(video);
      autoplay(video);
    }
  });
}

// ─── Back to top (see back-to-top.css) ─────────────
// Up to 1024px the index sits above the content: the button shows once the
// index has left the top (before that it would cover the first label).
// From 1025px the index stays visible in the sticky sidebar: the button
// shows after scrolling one viewport. In both cases it hides on reaching
// related work and the footer, which has its own "Up" link.
// It is computed on scroll (once per frame) and not with an
// IntersectionObserver: a scroll jump (an index link, a reload mid-page) can
// pass the index without crossing the viewport, and the observer would not
// notice.

let stopBackToTop = () => {};
const desktop = window.matchMedia('(min-width: 1025px)'); // the sidebar stacks at max-width: 1024px

function initBackToTop() {
  stopBackToTop();

  const button = document.querySelector('.back-to-top');
  const index  = document.querySelector('.section-index');
  if (!button || !index) return;

  let frame = 0;
  const update = () => {
    frame = 0;
    if (!button.isConnected) return stopBackToTop(); // left the page (SPA)
    const scrolledPast = desktop.matches
      ? window.scrollY > window.innerHeight
      : index.getBoundingClientRect().bottom < 0;
    const atEnd = [...document.querySelectorAll('.related-work:not([hidden]), site-footer')]
      .some(el => el.getBoundingClientRect().top < window.innerHeight);
    button.dataset.visible = String(scrolledPast && !atEnd);
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();

  stopBackToTop = () => {
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    cancelAnimationFrame(frame);
  };
}

// ─── Rendering ─────────────────────────────────────

async function renderCase(project, allProjects) {
  // Document metadata
  document.title = `${project.title} — Laura Caballero García`;
  document.querySelector('meta[name="description"]')
    ?.setAttribute('content', project.summary ?? '');
  document.querySelector('meta[property="og:title"]')
    ?.setAttribute('content', project.title);
  document.querySelector('meta[property="og:description"]')
    ?.setAttribute('content', project.summary ?? '');

  // Hero. If the project declares heroMobile (vertical crop), <picture>
  // serves it on portrait phones (HERO_MOBILE_MEDIA); otherwise every screen
  // uses the hero. Both offer every width (srcset) at the full viewport width.
  const hero = document.querySelector('.case__hero');
  if (hero && project.hero) {
    const picture = document.createElement('picture');
    picture.className = 'case__hero-picture';
    if (project.heroMobile) {
      const source = document.createElement('source');
      source.media  = HERO_MOBILE_MEDIA;
      source.srcset = srcsetFor(project.heroMobile)?.srcset ?? project.heroMobile;
      source.sizes  = '100vw';
      picture.appendChild(source);
    }
    const img = document.createElement('img');
    const heroVariants = srcsetFor(project.hero);
    if (heroVariants) {
      img.sizes  = '100vw';
      img.srcset = heroVariants.srcset;
      img.width  = heroVariants.width;
      img.height = heroVariants.height;
    }
    img.src      = project.hero;
    img.alt      = '';
    img.loading  = 'eager';
    img.fetchPriority = 'high';
    img.decoding = 'async';
    img.classList.add('case__hero-image');
    picture.appendChild(img);
    hero.appendChild(picture);
  }

  // Sidebar: title, client, tags
  setText('case-title',  project.title);
  setText('case-client', project.client ?? '');

  const tagsEl = $('case-tags');
  if (tagsEl) {
    tagsEl.innerHTML = project.tags
      .map(t => `<span class="case-header__tag">${t}</span>`)
      .join('');
  }

  // Summary
  setText('case-summary', project.summary ?? '');

  // Metadata
  setText('case-timeline', project.timeline ?? '');

  if (project.roles) {
    const rolesEl = $('case-role');
    if (rolesEl) {
      rolesEl.innerHTML = project.roles
        .map(r => `<li>${r}</li>`)
        .join('');
    }
  }

  if (project.tools) {
    const toolsEl = $('case-tools');
    if (toolsEl) {
      toolsEl.innerHTML = project.tools
        .map(t => `<li>${t}</li>`)
        .join('');
    }
  }

  if (project.team) {
    const teamEl = $('case-team');
    if (teamEl) {
      teamEl.innerHTML = project.team
        .map(m => `<li>${m}</li>`)
        .join('');
    }
  }

  // Case study content (Markdown)
  const body = $('case-body');
  if (body) {
    try {
      const html = await fetchProjectContent(project.slug);
      body.innerHTML = html;

      initInsightsCarousel(body);
      initCaseLightbox(body);
      initLoopVideos(body);

      // Wraps each h2 (and its eyebrow, if any) with its content in a
      // <section>. The section id comes from the eyebrow when there is one
      // (the short label meant for navigation) and otherwise from the
      // heading itself as a fallback.
      const h2s = Array.from(body.querySelectorAll('.case-section__title'));

      h2s.forEach((h2, i) => {
        const eyebrowEl = getEyebrowFor(h2);
        const label = (eyebrowEl ?? h2).textContent.trim();

        const section = document.createElement('section');
        section.className = 'case-section';
        section.id = slugify(label);

        // The walk towards the next h2 must stop BEFORE that section's
        // eyebrow; otherwise the loop drags it into the current section as
        // one more paragraph, and getEyebrowFor() no longer finds it when
        // its turn comes.
        const next = h2s[i + 1];
        const nextBoundary = next ? (getEyebrowFor(next) ?? next) : null;

        const siblings = [];
        let el = h2.nextElementSibling;
        while (el && el !== nextBoundary) {
          siblings.push(el);
          el = el.nextElementSibling;
        }

        const anchor = eyebrowEl ?? h2;
        anchor.before(section);

        if (eyebrowEl) section.appendChild(eyebrowEl);
        section.appendChild(h2);
        siblings.forEach(s => section.appendChild(s));
      });

    } catch (err) {
      console.error('Error in fetchProjectContent:', err);
    }
  }



  // Index, after wrapping the sections
  renderIndex();
  initBackToTop();

  // Related work, last, so a failure here does not affect the case study
  renderRelatedWork(project, allProjects);

  hide('case-loading');
  show('case-content');
}

function renderError() {
  hide('case-loading');
  show('case-error');
}

// ─── Bootstrap ──────────────────────────────────────

async function init() {
  const slug = getSlugFromURL();

  if (!slug) { renderError(); return; }

  try {
    const projects = await fetchProjects();
    const project  = projects.find(p => p.slug === slug);

    if (!project) { renderError(); return; }

    await renderCase(project, projects);
  } catch (err) {
    console.error('Error loading the project:', err);
    renderError();
  }
}

/** Exports the init function for the router */
export function initCase() {
  init();
}