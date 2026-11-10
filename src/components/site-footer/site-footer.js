/**
 * site-footer.js — Site footer
 * Notes, copyright and contact card. Copies the email address to the
 * clipboard and announces it to screen readers.
 */

const EMAIL = 'lauracaballer19@gmail.com';

class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.render();
    this._bindEvents();
  }

  render() {
    const year = new Date().getFullYear();
    this.innerHTML = `
      <footer class="site-footer">
        <div class="container-full site-footer__inner">

          <div class="site-footer__notes">
            <section class="site-footer__note" aria-labelledby="footer-a11y-title">
              <h2 class="site-footer__note-title" id="footer-a11y-title">Notes on accessibility</h2>
              <p class="site-footer__note-text">
                This website is still a work in progress. I'm continuously improving it to make it as accessible as possible. If you notice any issues or spot opportunities for improvement, I'd love to hear from you.
              </p>
            </section>

            <section class="site-footer__note" aria-labelledby="footer-sustainability-title">
              <h2 class="site-footer__note-title" id="footer-sustainability-title">Notes on sustainability</h2>
              <p class="site-footer__note-text">
                This website is hosted on
                <a class="site-footer__link" href="https://pages.cloudflare.com" rel="noopener noreferrer" target="_blank">Cloudflare Pages</a>
                to help reduce its environmental impact. I'm continuously exploring ways to create a more sustainable web without compromising the visual experience.
              </p>
            </section>

            <p class="site-footer__copyright">
              Copyright® ${year} <span aria-hidden="true">|</span> All rights reserved
            </p>
          </div>

          <div class="site-footer__card">
            <p class="site-footer__cta">If you'd like to talk about a project, don't hesitate to get in touch.</p>

            <div class="site-footer__bottom">
              <div class="site-footer__group">
                <p class="site-footer__label">Contact</p>
                <button type="button" class="site-footer__chip site-footer__copy">
                  ${EMAIL}<span class="visually-hidden"> (copy to clipboard)</span>
                </button>
                <p class="visually-hidden" role="status" data-footer-status></p>
              </div>

              <nav class="site-footer__group" aria-labelledby="footer-socials-label">
                <p class="site-footer__label" id="footer-socials-label">Socials</p>
                <ul class="site-footer__links" role="list">
                  <li><a class="site-footer__chip" href="https://www.linkedin.com/in/laura-caballero-garcia" rel="noopener noreferrer" target="_blank">LinkedIn</a></li>
                  <li><a class="site-footer__chip" href="https://www.behance.net/lauracaballero12" rel="noopener noreferrer" target="_blank">Behance</a></li>
                  <li><a class="site-footer__chip" href="https://github.com/lauracaballerogarcia/portfolio-web" rel="noopener noreferrer" target="_blank">GitHub</a></li>
                </ul>
              </nav>

              <a class="site-footer__up" href="#top">Up<span class="visually-hidden"> (back to top)</span></a>
            </div>
          </div>

        </div>
      </footer>
    `;
  }

  _bindEvents() {
    const copyButton = this.querySelector('.site-footer__copy');
    const status     = this.querySelector('[data-footer-status]');
    let resetTimer;

    // Copies the email and shows a check icon for a moment
    copyButton?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(EMAIL);
        copyButton.dataset.state = 'copied';
        status.textContent = 'Email address copied to clipboard';
      } catch {
        // No clipboard access: open the mail app instead
        window.location.href = `mailto:${EMAIL}`;
        return;
      }

      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        delete copyButton.dataset.state;
        status.textContent = '';
      }, 2500);
    });
  }
}

customElements.define('site-footer', SiteFooter);