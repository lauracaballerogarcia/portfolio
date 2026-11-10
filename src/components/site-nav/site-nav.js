/**
 * site-nav.js — Site header
 * Logo, main navigation bar and local time. Marks the current page,
 * sends "Let's talk" to the footer contact card and keeps the clock
 * up to date.
 */

const NAV_ITEMS = [
  { label: 'Feed',    href: '/' },
  { label: 'Archive', href: '/archive/' },
  { label: 'About',   href: '/about/' },
];

const TIME_ZONE = 'Europe/Madrid';

class SiteNav extends HTMLElement {
  connectedCallback() {
    this.render();
    this._markCurrent();
    this._bindContact();
    this._startClock();
  }

  disconnectedCallback() {
    clearTimeout(this._clockTimer);
  }

  render() {
    const items = NAV_ITEMS.map(({ label, href }) => `
      <li class="site-nav__item">
        <a class="site-nav__link" href="${href}">
          <span class="site-nav__indicator" aria-hidden="true"></span>
          <span class="site-nav__label">${label}</span>
        </a>
      </li>
    `).join('');

    this.innerHTML = `
      <header class="site-nav">
        <div class="container-full site-nav__inner">
          <a href="/" class="site-nav__logo">
            Laura Caballero García – Digital Product Designer
          </a>

          <nav class="site-nav__bar" aria-label="Main">
            <ul class="site-nav__list" role="list">
              ${items}
              <li class="site-nav__item">
                <a class="site-nav__cta" href="#contact">Let's talk</a>
              </li>
            </ul>
          </nav>

          <p class="site-nav__time">
            <span class="visually-hidden">Local time in Spain: </span>
            <time class="site-nav__time-value"></time>
            <span aria-hidden="true">ES</span>
          </p>
        </div>
      </header>
    `;
  }

  // Marks the link of the current page (the white indicator follows it)
  _markCurrent() {
    const path = window.location.pathname;

    this.querySelectorAll('.site-nav__link').forEach(link => {
      const href = link.getAttribute('href');
      const isCurrent = href === '/'
        ? path === '/' || path === '/index.html'
        : path.startsWith(href.replace(/\/$/, ''));

      if (isCurrent) link.setAttribute('aria-current', 'page');
    });
  }

  // "Let's talk": the footer is pinned behind main, so an anchor would not
  // scroll to it. Scrolls to the end of the page and moves focus to the card.
  _bindContact() {
    this.querySelector('.site-nav__cta')?.addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({ top: document.documentElement.scrollHeight });
      document.getElementById('contact')?.focus({ preventScroll: true });
    });
  }

  // Local time in Spain, updated at the start of every minute
  _startClock() {
    const time   = this.querySelector('.site-nav__time-value');
    const format = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: TIME_ZONE,
    });

    const tick = () => {
      const now = new Date();
      const value = format.format(now);
      time.textContent = value;
      time.dateTime = value;
      this._clockTimer = setTimeout(tick, 60000 - (now.getSeconds() * 1000 + now.getMilliseconds()));
    };

    tick();
  }
}

customElements.define('site-nav', SiteNav);