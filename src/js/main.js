// LOGO ANIMATION

const stage = document.getElementById('stage');
const hasSeenIntro = sessionStorage.getItem('introSeen');

if (hasSeenIntro) {
    // Ya ha visto la animación — elimina el stage y muestra el contenido
    stage.remove();
    document.body.classList.remove('is-loading');
} else {
    // Primera vez o refresh — muestra la animación
    sessionStorage.setItem('introSeen', 'true');

    stage.addEventListener('animationend', (e) => {
        if (e.animationName === 'hideIntro') {
            stage.remove();
            document.body.classList.remove('is-loading');
        }
    });
}


// LOGO SCALE

(function () {

    const fill  = document.getElementById('fill');
    const stage = document.getElementById('stage');

    /* ── Calcula el scale-end del fill ── */
    function calcFillScale() {
        const maxDim = Math.max(stage.offsetWidth, stage.offsetHeight);
        fill.style.setProperty('--scale-end', Math.ceil((maxDim * 1.5) / 28));
    }

    calcFillScale();
    window.addEventListener('resize', calcFillScale);

})();





// CURSOR PREVIEW

// 1. Selección de elementos

const items = document.querySelectorAll(".archive-list-item");
const preview = document.querySelector(".cursor-preview");
const previewImg = preview?.querySelector("img");
const previewSources = preview?.querySelectorAll("source");

// 2. Definición de imágenes

const images = {
  senda: {
    avif: new URL("../media/images/senda-hero.jpg?as=avif", import.meta.url).href,
    webp: new URL("../media/images/senda-hero.jpg?as=webp", import.meta.url).href,
    jpg: new URL("../media/images/senda-hero.jpg", import.meta.url).href,
  },
  parc: {
    avif: new URL("../media/images/parc-central-hero.jpg?as=avif", import.meta.url).href,
    webp: new URL("../media/images/parc-central-hero.jpg?as=webp", import.meta.url).href,
    jpg: new URL("../media/images/parc-central-hero.jpg", import.meta.url).href,
  },
  xana: {
    avif: new URL("../media/images/xana-hero.jpg?as=avif", import.meta.url).href,
    webp: new URL("../media/images/xana-hero.jpg?as=webp", import.meta.url).href,
    jpg: new URL("../media/images/xana-hero.jpg", import.meta.url).href,
  },
};

//  3. PRECARGA (aquí es donde debe ir)
Object.values(images).forEach(imgSet => {
  Object.values(imgSet).forEach(src => {
    const img = new Image();
    img.src = src;
  });
});


// 4. Eventos

if (preview && previewImg && previewSources.length) {

  items.forEach((item) => {

    item.addEventListener("mouseenter", () => {
      const key = item.dataset.image;
      const img = images[key];
      if (!img) return;

      // Actualizar sources (formatos modernos)
      previewSources[0].srcset = img.avif;
      previewSources[1].srcset = img.webp;

      // Fallback
      previewImg.src = img.jpg;

      preview.style.opacity = "1";
      preview.style.transform = "scale(1)";
    });

    item.addEventListener("mouseleave", () => {
      preview.style.opacity = "0";
      preview.style.transform = "scale(0.8)";
    });

    item.addEventListener("mousemove", (e) => {
      const offset = 20;
      preview.style.left = e.clientX + offset + "px";
      preview.style.top = e.clientY + offset + "px";
    });

  });
}

console.log("Preview ready");


// // CURSOR PREVIEW

// const items = document.querySelectorAll(".archive-list-item");
// const preview = document.querySelector(".cursor-preview");
// const previewImg = preview?.querySelector("img");

// // Imágenes

// const images = {
//   senda: new URL("../media/images/senda-hero.jpg", import.meta.url).href,
//   parc: new URL("../media/images/parc-central-hero.jpg", import.meta.url).href,
//   xana: new URL("../media/images/xana-hero.jpg", import.meta.url).href,
// };

// if (preview && previewImg) {
//   items.forEach((item) => {

//     item.addEventListener("mouseenter", () => {
//       const key = item.dataset.image;
//       const imgSrc = images[key];
//       if (!imgSrc) return;

//       previewImg.src = imgSrc;

//       preview.style.opacity = "1";
//       preview.style.transform = "scale(1)";
//     });

//     item.addEventListener("mouseleave", () => {
//       preview.style.opacity = "0";
//       preview.style.transform = "scale(0.8)";
//     });

//     item.addEventListener("mousemove", (e) => {
//       const offset = 20;
//       preview.style.left = e.clientX + offset + "px";
//       preview.style.top = e.clientY + offset + "px";
//     });

//   });
// }
// console.log("Preview ready");



// PAGE ANIMATION

import { gsap } from "gsap";

window.addEventListener("load", () => {
  gsap.fromTo(".page",
    { y: "10%", opacity: 0 },
    { y: "0%", opacity: 1, duration: 0.8, ease: "power2.out" }
  );
});


// DETAILS TOGGLE

document.querySelectorAll("details").forEach((detail) => {
  const summary = detail.querySelector("summary");

  detail.addEventListener("toggle", () => {
    summary.textContent = detail.open ? "Read less" : "Read more";
  });
});