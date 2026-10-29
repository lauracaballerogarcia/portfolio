/**
 * index.js — Home page
 *
 * Orchestrates data loading, state and rendering.
 * This is the only layer that connects data with the DOM.
 */

import store from '../state/store.js';
import { fetchProjects, hasCaseStudy, getThumbnail, HERO_MOBILE_MEDIA } from '../data/projects.js';

// Components
import '../components/site-nav/site-nav.js';
import '../components/site-footer/site-footer.js';

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
              <source media="${HERO_MOBILE_MEDIA}" srcset="${project.heroMobile}">` : ''}
              <img
                class="featured-card__image"
                src="${thumb}"
                width="2880"
                height="1800"
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