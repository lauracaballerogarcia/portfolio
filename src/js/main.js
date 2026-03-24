const name = 'world';
console.log(`Hello ${name}`);




// DETAILS

const details = document.querySelectorAll("details");

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

import senda from "../media/images/xana-hero.png";
import parc from "../media/images/xana-hero.png";
import xana from "../media/images/xana-hero.png";

const images = {
  senda,
  parc, 
  xana
};

const items = document.querySelectorAll(".archive-list-item");
const preview = document.querySelector(".cursor-preview");
const previewImg = preview.querySelector("img");

items.forEach((item) => {
  item.addEventListener("mouseenter", () => {
    const key = item.dataset.image;
    previewImg.src = images[key];

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


// items.forEach((item) => {
//   item.addEventListener("mouseenter", () => {
//     console.log("hover:", item.dataset.image);
//   });
// });

console.log("SRC:", previewImg.src);