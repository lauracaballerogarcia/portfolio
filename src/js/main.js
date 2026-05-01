// LOGO ANIMATION

const stage = document.getElementById('stage');
const hasSeenIntro = sessionStorage.getItem('introSeen');


if (stage) {

    if (hasSeenIntro) {
        // The user has already seen the animation in this session —> skip it
        stage.remove();
        document.body.classList.remove('is-loading');
    } else {
        // First time or refresh —> show the animation
        sessionStorage.setItem('introSeen', 'true');

        stage.addEventListener('animationend', (e) => {
            if (e.animationName === 'hideIntro') {
                stage.remove();
                document.body.classList.remove('is-loading');
            }
        });
    }


    // This IIFE calculates the necessary scale for the fill element to cover the entire stage during the animation. 
    // It also updates this calculation on window resize to ensure the animation remains consistent across different screen sizes.

    (function () {

        const fill = document.getElementById('fill');

        if (!fill) return; // If the stage has already been removed, do nothing.

        // Calculates the scale-end for the fill based on the stage size and the fill's actual size in px (respecting rem units).
        function calcFillScale() {
            const maxDim  = Math.max(stage.offsetWidth, stage.offsetHeight);
            const fillSize = fill.offsetWidth; // Reads the actual size in px, respecting rem units.
            fill.style.setProperty('--scale-end', Math.ceil((maxDim * 1.5) / fillSize));
        }

        calcFillScale();
        window.addEventListener('resize', calcFillScale);

    })();
}

// Page enter animation — only if the user has already seen the intro

if (hasSeenIntro) {
    document.querySelector('.page')?.classList.add('page-enter');
}

// CURSOR PREVIEW

// 1. Selección de elementos
const items = document.querySelectorAll(".archive-list-item");
const preview = document.querySelector(".cursor-preview");
const previewPicture = preview?.querySelector("picture");

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

// 3. Función para actualizar el picture completo
function updatePicture(imgSet) {
    if (!previewPicture) return;

    // Reconstruye el contenido del <picture> completo
    previewPicture.innerHTML = `
        <source srcset="${imgSet.avif}" type="image/avif">
        <source srcset="${imgSet.webp}" type="image/webp">
        <img src="${imgSet.jpg}" alt="">
    `;
}

// 4. Precarga
Object.values(images).forEach(imgSet => {
    // Precarga jpg como fallback fiable
    const img = new Image();
    img.src = imgSet.jpg;
});

// 5. Eventos
if (preview && previewPicture) {

    items.forEach((item) => {

        item.addEventListener("mouseenter", () => {
            const key = item.dataset.image;
            const imgSet = images[key];
            if (!imgSet) return;

            updatePicture(imgSet);

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

// console.log("Preview ready");



// PAGE ANIMATION

// import { gsap } from "gsap";

// window.addEventListener("load", () => {
//   gsap.fromTo(".page",
//     { y: "10%", opacity: 0 },
//     { y: "0%", opacity: 1, duration: 0.8, ease: "power2.out" }
//   );
// });



// DETAILS TOGGLE

document.querySelectorAll("details").forEach((detail) => {
  const summary = detail.querySelector("summary");

  detail.addEventListener("toggle", () => {
    summary.textContent = detail.open ? "Read less" : "Read more";
  });
});