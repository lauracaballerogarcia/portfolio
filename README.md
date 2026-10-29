# Portfolio — Diseño de producto digital

Web construida con HTML, CSS y JavaScript vanilla + Parcel como bundler.
Sin frameworks. Sin dependencias en runtime.

## Stack

- **Bundler:** Parcel 2
- **Componentes:** Web Components nativos (Custom Elements)
- **Estado:** Store observable mínimo (sin librería)
- **Estilos:** CSS custom properties + BEM ligero
- **Hosting:** Cloudflare Pages

## Arrancar en local

```bash
npm install
npm run dev
```

Abre http://localhost:1234

## Build para producción

```bash
npm run build
```

El resultado queda en `/dist`. Despliega esa carpeta en Cloudflare Pages.

## Estructura del proyecto

```
src/
  components/         # Lógica de los componentes compartidos (JS)
    site-nav/         # Navegación principal (Web Component)
    site-footer/      # Pie de página (Web Component)
    tag-filter/ project-card/   # Sin uso: no se importan en ninguna parte
  data/
    projects.json     # Fuente de datos de proyectos
    projects.js       # Capa de datos y renderer Markdown del case study
    content/*.md      # Case studies
  state/
    store.js          # Estado observable mínimo (Home)
  styles/             # Todo el CSS, por capas ITCSS (ver main.css)
    main.css          # Único punto de entrada: solo @import e índice CONTENTS
    settings/         # tokens.css (ver TOKENS.md)
    tools/            # Vacía: sin preprocesador
    generic/          # font-face.css, reset.css
    elements/         # page, media, links, lists, headings, paragraphs, buttons
    objects/          # container.css
    components/       # Un archivo por bloque BEM
      *.css           # Compartidos (los sincroniza /design-sync)
      home/ archive/ about/ case/   # Bloques de cada página
    utilities/        # visually-hidden.css
  pages/
    index.html        # Documento único (SPA)
    main.js           # Router — importa main.css
    index.js          # Home
    archive/ about/   # Plantilla y lógica de cada página
    case/             # Case study (la URL sigue siendo /project/<slug>/)
```

## Estilos

- Todo el CSS entra por `src/styles/main.css`. El orden de los `@import` es el orden de la cascada (ITCSS): settings → generic → elements → objects → components → utilities. Para añadir una hoja nueva, impórtala ahí, en su capa; no la importes desde JS.
- Un archivo por bloque BEM (`bloque__elemento--modificador`), cada uno con una cabecera `#NOMBRE` para encontrarlo rápido; las notas numeradas (`/* [1] */`) explican cada decisión. Comentarios en inglés.
- Los selectores de etiqueta solo se usan en la capa elements. El contenido Markdown de los case studies también lleva clases: las pone el renderer de `projects.js` (`case-section__title`, `__text`, `__list`…), y el HTML escrito en los `.md` usa las suyas (`case-section__eyebrow`, `case-note`, `case-evaluation`, `insights`).
- Mobile first solo donde ahorra código (`featured-card`, `case-figure`); el resto mantiene `max-width`.
- JavaScript localiza el marcado escrito a mano (plantillas HTML, Markdown) por `id` o atributos `data-*`; en los componentes que él mismo genera usa sus clases BEM. Los estados se comunican con atributos (`aria-pressed`, `aria-current`, `data-visible`, `data-state`) que el CSS lee.

## Imágenes y vídeos

```
media-src/<proyecto>/     # Originales WebP y SVG (no se publican)
public/media/<proyecto>/  # Lo que se publica en /media/<proyecto>/ — estructura plana
```

- WebP y SVG (también posters): se guardan en `media-src/<proyecto>/` y se ejecuta `npm run media`.
- MP4: directamente en `public/media/<proyecto>/`.
- Los archivos listados en `media-manifest.json` son generados: no se editan a mano.
- `npm run media:check` comprueba referencias, manifiesto y rutas sin modificar nada.
- Las referencias son explícitas y absolutas (`/media/…`) en `src/data/projects.json` (`hero`, `heroMobile` opcional, `thumbnail`) y en el Markdown:

```md
![alt](/media/p/video.mp4 "full 1440x900 poster=/media/p/video-poster.webp")
```

## Añadir un proyecto

Edita `src/data/projects.json` y añade un objeto con esta forma (el case study, si lo hay, va en `src/data/content/<slug>.md` y se registra en `src/data/projects.js`):

```json
{
  "id": "04",
  "slug": "nombre-del-proyecto",
  "title": "Título del proyecto",
  "summary": "Descripción breve.",
  "tags": ["Accesibilidad"],
  "year": "2025",
  "hero": "/media/nombre-del-proyecto/nombre-del-proyecto-01-hero.webp",
  "thumbnail": "/media/nombre-del-proyecto/nombre-del-proyecto-00-thumbnail.webp",
  "featured": false
}
```

## Migración a framework

La arquitectura está diseñada para facilitar una futura migración:

- `/data/projects.js` — se reutiliza sin cambios en React, Vue o cualquier otro
- `/state/store.js`   — se adapta a useState/useReducer o Pinia directamente
- `/styles/settings/tokens.css` — los custom properties son universales
- Los Web Components — se reescriben como componentes del framework elegido,
  manteniendo la misma interfaz de props/atributos
```
