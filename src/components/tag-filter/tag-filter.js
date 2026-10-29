/**
 * tag-filter.js — Project filter by category
 * Updates the store; it does not render projects itself.
 */

import store from '../../state/store.js';

class TagFilter extends HTMLElement {
  connectedCallback() {
    this._unsubscribe = store.subscribe(state => this._updateActive(state.activeTag));
    this.render();
  }

  disconnectedCallback() {
    this._unsubscribe?.();
  }

  render() {
    const tags = JSON.parse(this.getAttribute('tags') ?? '[]');

    this.innerHTML = `
      <nav class="tag-filter" aria-label="Filtrar proyectos por categoría">
        <ul class="tag-filter__list" role="list">
          <li>
            <button class="tag-filter__btn is-active" data-tag="all" aria-pressed="true">
              Todos
            </button>
          </li>
          ${tags.map(tag => `
            <li>
              <button class="tag-filter__btn" data-tag="${tag}" aria-pressed="false">
                ${tag}
              </button>
            </li>
          `).join('')}
        </ul>
      </nav>
    `;

    this.querySelectorAll('.tag-filter__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        store.setState({ activeTag: btn.dataset.tag });
      });
    });
  }

  _updateActive(activeTag) {
    this.querySelectorAll('.tag-filter__btn').forEach(btn => {
      const isActive = btn.dataset.tag === activeTag;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }
}

customElements.define('tag-filter', TagFilter);
