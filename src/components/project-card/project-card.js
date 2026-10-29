/**
 * project-card.js — Web Component
 *
 * Attribute API similar to React/Vue props.
 * The rendering logic is fully separate from the data
 * logic (which lives in /data/projects.js).
 */

class ProjectCard extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'summary', 'tags', 'year', 'slug', 'cover'];
  }

  connectedCallback()               { this.render(); }
  attributeChangedCallback()        { this.render(); }

  get _props() {
    return {
      title:   this.getAttribute('title')   ?? '',
      summary: this.getAttribute('summary') ?? '',
      tags:    (this.getAttribute('tags') ?? '').split(',').filter(Boolean),
      year:    this.getAttribute('year')    ?? '',
      slug:    this.getAttribute('slug')    ?? '#',
      cover:   this.getAttribute('cover')   ?? '',
    };
  }

  render() {
    const { title, summary, tags, year, slug, cover } = this._props;

    const tagsHTML = tags
      .map(t => `<span class="project-card__tag">${t}</span>`)
      .join('');

    this.innerHTML = `
      <article class="project-card">
        <a href="/proyecto/${slug}" class="project-card__link" aria-label="Ver proyecto: ${title}">
          <div class="project-card__media">
            ${cover
              ? `<img src="${cover}" alt="" loading="lazy" decoding="async">`
              : `<div class="project-card__placeholder" aria-hidden="true"></div>`}
          </div>
          <div class="project-card__body">
            <div class="project-card__meta">
              <span class="project-card__year">${year}</span>
              <div class="project-card__tags" aria-label="Categorías">${tagsHTML}</div>
            </div>
            <h2 class="project-card__title">${title}</h2>
            <p class="project-card__summary">${summary}</p>
          </div>
        </a>
      </article>
    `;
  }
}

customElements.define('project-card', ProjectCard);
