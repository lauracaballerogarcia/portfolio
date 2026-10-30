# Portfolio design system: conventions (read first)

## What this is

A **styles-only** design system taken from a static portfolio site built with native HTML, CSS and JavaScript (Custom Elements plus CSS classes, bundled with Parcel). **The site does not use React.** `window.Portfolio` is intentionally empty: there are **no JS components** to import. What ships is:

- **Tokens:** CSS custom properties (`--…`), declared in `_ds_bundle.css`.
- **Fonts:** `fonts/fonts.css`, with Geist (sans, default body) and Geist Mono. The site's serif, Sentient, is not included for licensing reasons, so `--font-family-serif` renders as Georgia here. Do not add or link other font files for it.
- **Shared styles:** reset, base element styles, layout objects, component classes and one utility.

Link `styles.css` once. It pulls in fonts and `_ds_bundle.css`. Nothing else is needed.

> **Precedence over the generated README.** These conventions describe this project's real architecture and override the generic instructions in the README section generated below (starting at `# Portfolio (portfolio@1.0.0)`). That section is boilerplate the sync tool writes for React component libraries, and it does not represent this project. Ignore its instructions about:
>
> - React as the implementation of the portfolio;
> - `ReactDOM` or mounting components;
> - `window.Portfolio` as a component library (it is intentionally empty);
> - `components/<group>/<Name>/`;
> - `tokens/*.css`.
>
> Neither of those folders exists in this package. The **Tokens** list in that generated section **is** valid: it is read from the real `_ds_bundle.css`.

## Rules for designs built with this system

- **No React:** do not introduce React, and do not wrap these styles in React components or propose React as the implementation. Express components as semantic HTML that uses the classes below.
- **App code stays out:** do not modify or re-create the site's router, and do not run or imitate application logic (data loading, filtering, state, Custom Element scripts). None of that code is in this package.
- **No invented content:** do not invent project content such as titles, claims, case studies, images, clients or contact details. Use obvious placeholders (`Project title`, `Short project claim`).
- **No invented system parts:** do not invent components, variants, tokens or values. Use only the names listed here.
- **Separation of concerns:** content goes in HTML, presentation comes from these classes and tokens, and behaviour belongs to the site's own JS. State is expressed with ARIA attributes (`aria-pressed`, `aria-current`), not with extra classes.
- **Your own CSS:** layout glue you write must use tokens via `var(--…)`. Prefer semantic tokens over primitives, and never hard-code a value that a token covers.

## Tokens (real names)

- **Text colour:** `--color-text-primary`, `-secondary`, `-tertiary`, `-inverse`
- **Background colour:** `--color-background-primary`, `-secondary`, `-placeholder`, `-inverse`
- **Outline colour:** `--color-outline-primary`
- **Tag colour:** `--color-tag-background`
- **Colour primitives:**
  - `--color-neutral-{0,50,100,200,600,700,950}`
  - `--color-green-100`
  - `--color-blue-{50,100}`
- **Spacing:**
  - `--spacing-{1,2,3,4,5,6,8,10,12,16,24}`, where each step is 4px
  - semantic: `--spacing-container-inline`, `--spacing-container-block`, `--spacing-grid-column`, `--spacing-grid-row`, `--spacing-paragraph`
- **Radius:**
  - `--radius-{1,2,4,8}`, `--radius-full`
  - semantic: `--radius-card-l`, `--radius-card-s`, `--radius-chip`, `--radius-button-primary`
- **Type:**
  - `--font-family-{sans,serif,mono}`
  - `--font-size-{xs,s,m,l,xl,2xl,3xl}`
  - `--font-weight-{regular,medium}`
- **Size:**
  - `--size-icon-{s,m,l}`
  - `--size-button-icon`, `--size-header-height`, `--size-content-max`
- **Motion:** `--duration-{base,medium,slow}`, `--easing-out`
- **Breakpoints:** `480px · 640px · 768px · 1024px`. These are literal values, not tokens.

## Classes (real names)

- **Layout:**
  - `.container` centres content at `--size-content-max` and offsets it by the fixed header height.
  - `.container-full` gives full width with the site's side padding.
- **Utility:** `.visually-hidden` hides text visually but keeps it for screen readers.
- **`.skip-link`:** stays off-screen until it receives focus.
- **`.button-primary`:** filter/selection button. The selected state is `aria-pressed="true"`.
- **`.icon-button`:** round icon-only button (36px, 20px icon). Primary (default) on the page background, same colors as `.button-primary`; `.icon-button--secondary` over images and videos, opaque white like the chip, with a two-tone focus ring.
  - It needs an accessible name (`aria-label` or a `.visually-hidden` span).
  - The glyph is set per use through `mask-image` on `::before`. No icon assets ship here, so don't invent icons.
- **`.chip`, `.chip__label` and `.chip--coming-soon`:** floating label on a card image.
  - It is absolutely positioned, so the parent needs `position: relative`.
  - It expands while its enclosing `<a>` has hover or focus.
  - `--coming-soon` keeps the label visible and hides the arrow.
- **Site header:** `.site-nav`, `.site-nav__inner`, `.site-nav__menu`, `.site-nav__list`, `.site-nav__link`, `.site-nav__toggle` and `.site-nav__toggle-icon`.
  - The current link is marked with `aria-current="page"`; the open mobile menu with `.is-open`.
- **Site footer:** `.site-footer` and its `__inner`, `__info`, `__copy`, `__note`, `__nav`, `__links` and `__up` elements.
- **Header and footer markup:** on the site, `<site-nav>` and `<site-footer>` generate this markup with their own scripts. Treat them as fixed site chrome: don't redesign them or fill them with new links or contact data.

## Where the truth lives

`_ds_bundle.css` is the real source. Read it before styling. It contains the layers in cascade order: tokens, generic, elements, objects, components (`skip-link`, `site-nav`, `site-footer`, `button`, `icon-button`, `chip`) and utilities.

## Example

```html
<link rel="stylesheet" href="styles.css">

<main class="container">
  <div class="filters" role="group" aria-label="Filter projects">
    <button type="button" class="button-primary" aria-pressed="true">All</button>
    <button type="button" class="button-primary" aria-pressed="false">UX</button>
  </div>

  <a class="card" href="#">
    <figure class="card__figure">
      <img src="placeholder.jpg" alt="">
      <div class="chip chip--coming-soon"><span class="chip__label">Coming soon</span></div>
    </figure>
    <h2>Project title</h2>
    <p>Short project claim</p>
  </a>
</main>
```

```css
/* Layout glue for this example only. Not part of the design system. */
.filters { display: flex; flex-wrap: wrap; gap: var(--spacing-2); margin-block: var(--spacing-container-block); }
.card__figure { position: relative; border-radius: var(--radius-card-l); overflow: hidden; background: var(--color-background-placeholder); }
.card p { color: var(--color-text-secondary); }
```
