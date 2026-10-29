/**
 * site-nav.js — Main navigation
 * Handles the mobile menu with full accessibility (ARIA, focus).
 */

class SiteNav extends HTMLElement {
  connectedCallback() {
    this.render();
    this._bindEvents();
  }

  render() {
    this.innerHTML = `
      <header class="site-nav">
        <div class="container-full site-nav__inner">
          <a href="/" class="site-nav__logo">
            Laura Caballero García – Digital Product Designer
          </a>

          <button
            class="site-nav__toggle"
            aria-expanded="false"
            aria-controls="nav-menu"
            aria-label="Open menu"
          >
            <span class="site-nav__toggle-icon" aria-hidden="true"></span>
          </button>

          <nav id="nav-menu" class="site-nav__menu" aria-label="Main">
            <ul class="site-nav__list" role="list">
              <li><a class="site-nav__link" href="/archive/" data-label="Archive">Archive</a></li>
              <li><a class="site-nav__link" href="/about/" data-label="About">About</a></li>
            </ul>
          </nav>
        </div>
      </header>
    `;
  }

  _bindEvents() {
    const toggle = this.querySelector('.site-nav__toggle');
    const menu   = this.querySelector('.site-nav__menu');

    const setOpen = (open) => {
      toggle?.setAttribute('aria-expanded', String(open));
      toggle?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu?.classList.toggle('is-open', open);
    };

    const isOpen = () => toggle?.getAttribute('aria-expanded') === 'true';

    toggle?.addEventListener('click', () => setOpen(!isOpen()));

    // Closes the menu on a click outside
    document.addEventListener('click', e => {
      if (!this.contains(e.target)) setOpen(false);
    });

    // Closes with Escape and returns focus to the button
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Marks the active link
    const currentPath = window.location.pathname;
    this.querySelectorAll('.site-nav__link').forEach(link => {
      if (link.getAttribute('href') === currentPath) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }
}

customElements.define('site-nav', SiteNav);
