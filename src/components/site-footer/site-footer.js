/**
 * site-footer.js
 */

class SiteFooter extends HTMLElement {
  connectedCallback() {
    const year = new Date().getFullYear();
    this.innerHTML = `
      <footer class="site-footer">
        <div class="container-full site-footer__inner">
          <div class="site-footer__info">
            <p class="site-footer__copy">
              Copyright® ${year}
            </p>
            <p aria-hidden="true"> | </p>
            <p><a class="site-footer__link" href="mailto:lauracaballer19@gmail.com">lauracaballer19@gmail.com</a></p>
          </div>

          <p class="site-footer__note">
              Hosted on
              <a class="site-footer__link" href="https://pages.cloudflare.com" rel="noopener noreferrer" target="_blank">Cloudflare Pages</a>
              — green hosting
          </p>

          <nav class="site-footer__nav" aria-label="Footer">
            <ul class="site-footer__links" role="list">
              <li><a class="site-footer__link site-footer__link--social" href="https://www.linkedin.com/in/laura-caballero-garcia" rel="noopener noreferrer" target="_blank">LinkedIn</a></li>
              <li><a class="site-footer__link site-footer__link--social" href="https://www.behance.net/lauracaballero12" rel="noopener noreferrer" target="_blank">Behance</a></li>
              <li><a class="site-footer__link site-footer__link--social" href="https://github.com/lauracaballerogarcia/portfolio-web" rel="noopener noreferrer" target="_blank">GitHub</a></li>
            </ul>
            <a class="site-footer__up" href="#top">Up<span class="visually-hidden"> (back to top)</span></a>
          </nav>
        </div>
      </footer>
    `;
  }
}

customElements.define('site-footer', SiteFooter);
