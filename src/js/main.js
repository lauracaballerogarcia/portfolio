// IMPORTS

import { gsap } from "gsap";


// DETAILS

const details = document.querySelectorAll("details");
const content = details.querySelector(".details-content");


details.forEach((detail) => {
  const summary = detail.querySelector("summary");

  detail.addEventListener("toggle", () => {
    if (detail.open) {
      summary.textContent = "Read less";

    } else {
      summary.textContent = "Read more";
    }
  });
});


// CURSOR PREVIEW

const items = document.querySelectorAll(".archive-list-item");
const preview = document.querySelector(".cursor-preview");
const previewImg = preview?.querySelector("img");

// Imágenes

const images = {
  senda: new URL("../media/images/senda-hero.jpg", import.meta.url).href,
  parc: new URL("../media/images/parc-central-hero.jpg", import.meta.url).href,
  xana: new URL("../media/images/xana-hero.png", import.meta.url).href,
};


if (preview && previewImg) {
  items.forEach((item) => {

    item.addEventListener("mouseenter", () => {
      const key = item.dataset.image; // ahora es una clave, no una ruta

      const imgSrc = images[key];
      if (!imgSrc) return;

      previewImg.src = imgSrc;

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






// PAGE ANIMATION

gsap.fromTo(".page", 
  { y: "100%", opacity: 0 }, 
  { y: "0%", opacity: 1, duration: 0.8 }
);