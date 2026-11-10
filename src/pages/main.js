/**
 * main.js — Main router
 *
 * Detects the current URL and loads the matching module.
 * Single entry point for the whole application.
 */

// Every style comes in through one file, in ITCSS order
import '../styles/main.css';

import '../components/site-nav/site-nav.js';
import '../components/site-footer/site-footer.js';

import { initHome }    from './index.js';
import { initCase }    from './case/case.js';
import { initAbout }   from './about/about.js';

import { initArchive } from './archive/archive.js';
import archiveHTML     from 'bundle-text:./archive/archive.html';

import caseHTML    from 'bundle-text:./case/case.html';
import aboutHTML   from 'bundle-text:./about/about.html';

const path = window.location.pathname;
const main = document.querySelector('main');

// ─── Loads the page HTML and runs its module ──────────────────

function loadPage(html, initFn) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  main.innerHTML = doc.querySelector('main').innerHTML;
  initFn();
}

// ─── Router ───────────────────────────────────────────────────

if (path.startsWith('/project/')) {
  // The case study page (URL /project/<slug>/) manages its own width
  main.classList.remove('container');
  loadPage(caseHTML, initCase);

} else if (path.startsWith('/archive')) {
  document.title = 'Archive — Laura Caballero García';
  main.classList.add('container');
  loadPage(archiveHTML, initArchive);

} else if (path.startsWith('/about')) {
  document.title = 'About — Laura Caballero García';
  main.classList.add('container');
  loadPage(aboutHTML, initAbout);

} else {
  // Home page
  main.classList.add('container');
  initHome();
}

