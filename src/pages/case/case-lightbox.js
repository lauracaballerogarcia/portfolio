/**
 * case-lightbox.js — Lightbox for the case study figures
 *
 * Creates one <dialog> that every figure (.case-figure) of the page
 * reuses. Each figure gets an "enlarge" button that opens its image or
 * video full screen. The button icons are painted by CSS (mask-image),
 * so no SVG is injected here. Only figures marked `expand` in the
 * Markdown (data-expand="true", media with text to read) get a button.
 */

export function initCaseLightbox(root = document) {
  const figures = root.querySelectorAll('.case-figure[data-expand="true"]');
  if (!figures.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // The <dialog> is created once and every figure reuses it.
  let dialog = document.getElementById('case-lightbox');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'case-lightbox';
    dialog.className = 'case-lightbox';
    dialog.innerHTML = `
      <button type="button" class="icon-button icon-button--secondary case-lightbox__close" aria-label="Close enlarged view"></button>
      <img class="case-lightbox__image" src="" alt="" hidden>
      <video class="case-lightbox__video" controls loop muted playsinline hidden></video>
    `;
    document.body.appendChild(dialog);
  }

  const dialogImg = dialog.querySelector('.case-lightbox__image');
  const dialogVideo = dialog.querySelector('.case-lightbox__video');
  const closeButton = dialog.querySelector('.case-lightbox__close');

  let lastFocused = null;
  let sourceVideo = null;   // page video that opened the lightbox
  let resumeSource = false; // whether it was playing when opened

  function openImage(img, triggerButton) {
    lastFocused = triggerButton;
    dialogVideo.hidden = true;
    dialogImg.hidden = false;
    // The enlarged view picks its own width: srcset with the size of the
    // dialog (90vw), not the smaller one the page figure is using. Images
    // without variants have an empty srcset and use src (the full file).
    dialogImg.sizes = '90vw';
    dialogImg.srcset = img.srcset;
    dialogImg.src = img.src;
    dialogImg.alt = img.alt;
    dialog.setAttribute('aria-label', 'Enlarged image');
    dialog.showModal();
  }

  function openVideo(video, triggerButton) {
    lastFocused = triggerButton;
    sourceVideo = video;
    resumeSource = !video.paused;
    video.pause(); // avoids two playbacks at once

    dialogImg.hidden = true;
    dialogVideo.hidden = false;
    // With preload="none" the video may not have loaded yet: use the <source>
    dialogVideo.src = video.currentSrc || video.querySelector('source')?.src || '';
    dialogVideo.setAttribute('aria-label', video.getAttribute('aria-label') ?? '');
    dialog.setAttribute('aria-label', 'Enlarged video');
    dialog.showModal();

    if (!reduceMotion.matches) dialogVideo.play().catch(() => {});
  }

  function closeLightbox() {
    dialog.close();
  }

  closeButton.addEventListener('click', closeLightbox);

  // Closes on a click on the backdrop (outside the content).
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeLightbox();
  });

  // <dialog> already closes with Escape natively; here we free the
  // resources, resume the original video if it was playing and return
  // focus to the button that opened the lightbox.
  dialog.addEventListener('close', () => {
    dialogImg.removeAttribute('srcset');
    dialogImg.src = '';
    dialogVideo.pause();
    dialogVideo.removeAttribute('src');
    dialogVideo.load();

    if (sourceVideo && resumeSource) sourceVideo.play().catch(() => {});
    sourceVideo = null;

    lastFocused?.focus();
  });

  figures.forEach((figure) => {
    if (figure.querySelector('.case-figure__expand')) return;

    const video = figure.querySelector('video');
    const img = figure.querySelector('img');
    if (!video && !img) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'icon-button icon-button--secondary case-figure__expand';
    button.setAttribute('aria-label', video ? 'Enlarge video' : 'Enlarge image');

    if (video) {
      button.addEventListener('click', () => openVideo(video, button));
      // Inside the video wrapper, to anchor it to the video
      figure.querySelector('.case-figure__video').appendChild(button);
    } else {
      button.addEventListener('click', () => openImage(img, button));
      figure.appendChild(button);
    }
  });
}