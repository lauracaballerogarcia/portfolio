/**
 * index.js — Home page
 *
 * Orchestrates data loading, state and rendering.
 * This is the only layer that connects data with the DOM.
 */

import store from '../state/store.js';
import { fetchProjects, hasCaseStudy, getThumbnail, HERO_MOBILE_MEDIA, responsiveAttrs, responsiveSourceAttrs } from '../data/projects.js';

// Components
import '../components/site-nav/site-nav.js';
import '../components/site-footer/site-footer.js';

// sizes of the featured cards: how wide each one is shown, so the browser
// picks the right width from srcset. Derived from the 12-column grid
// (featured-card.css) inside .container (1520px at most): the lead card
// takes the whole row; from 1025px the others alternate 7 and 5 columns
// (positions 4n+2 and 4n+5 take 7); from 769px they take 6; below that,
// the whole row. Approximate on purpose: the browser rounds up.
const CARD_SIZES = {
  lead:  '(min-width: 1568px) 1520px, calc(100vw - 48px)',
  seven: '(min-width: 1568px) 880px, (min-width: 1025px) calc(58.33vw - 35px), (min-width: 769px) calc(50vw - 32px), calc(100vw - 48px)',
  five:  '(min-width: 1568px) 624px, (min-width: 1025px) calc(41.67vw - 30px), (min-width: 769px) calc(50vw - 32px), calc(100vw - 48px)',
};

function cardSizes(i) {
  if (i === 0) return CARD_SIZES.lead;
  const n = i + 1; // nth-child position, as in the CSS
  return n % 4 === 2 || n % 4 === 1 ? CARD_SIZES.seven : CARD_SIZES.five;
}

/** Renders the project grid from the current state */
function renderProjects(state) {
  const list = document.querySelector('#featured-projects');
  if (!list) return;

  const visible = state.projects;

  list.setAttribute('aria-busy', state.loading ? 'true' : 'false');

  if (state.loading) {
    list.innerHTML = `<li class="featured-grid__status">Loading projects…</li>`;
    return;
  }

  if (state.error) {
    list.innerHTML = `<li class="featured-grid__status" role="alert">Projects couldn’t be loaded.</li>`;
    return;
  }

  if (visible.length === 0) {
    list.innerHTML = `<li class="featured-grid__status">No projects yet.</li>`;
    return;
  }

  list.innerHTML = visible.map((project, i) => {
    const isFeatured = i === 0;
    const available = hasCaseStudy(project.slug);
    const thumb = getThumbnail(project);
    const chipText  = !available ? 'Coming soon!'
                    : isFeatured ? 'See case study'
                    : 'See work';
    // No case study: a card without a link; the "Coming soon!" chip is
    // announced because it is the only hint of the project's status
    const wrapperStart = available
      ? `<a class="featured-card__link" href="/project/${project.slug}/">`
      : '<div class="featured-card__inner">';
    const wrapperEnd   = available ? '</a>' : '</div>';

    return `
        <li class="featured-card${isFeatured ? ' featured-card--lead' : ''}${available ? '' : ' featured-card--coming-soon'}">
        ${wrapperStart}
          <figure class="featured-card__figure">
            <picture>${isFeatured && project.heroMobile ? `
              <source media="${HERO_MOBILE_MEDIA}" ${responsiveSourceAttrs(project.heroMobile, CARD_SIZES.lead)}>` : ''}
              <img
                class="featured-card__image"
                ${responsiveAttrs(thumb, cardSizes(i))}
                ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}
                decoding="async"
                alt="">
            </picture>
            <div class="chip${available ? '' : ' chip--coming-soon'}"${available ? ' aria-hidden="true"' : ''}>
              <span class="chip__label">${chipText}</span>
            </div>
          </figure>
          <div class="featured-card__info">
            <h2 class="featured-card__title">${project.title}</h2>
            <p class="featured-card__claim">${project.claim ?? project.summary}</p>
          </div>
        ${wrapperEnd}
      </li>
    `;
  }).join('');
}


/** Bootstrap */
async function init() {
  store.subscribe(renderProjects);

  store.setState({ loading: true });

  try {
    const projects = await fetchProjects();
    const featured = projects.filter(p => p.featured === true);

    store.setState({ projects: featured, loading: false });
  } catch (err) {
    console.error(err);
    store.setState({ loading: false, error: err.message });
  }
}

/** Exports the init function for the router */
export function initHome() {
  init();
}