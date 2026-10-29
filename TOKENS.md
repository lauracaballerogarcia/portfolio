# Design tokens

All tokens live in a single `:root` block in `src/styles/settings/tokens.css`. Every page and component stylesheet uses them through `var()`. JavaScript never reads or writes a design token. The only custom properties set from JS are `--x` and `--y` in `archive.js`, which hold cursor coordinates for the hover preview. Those are runtime state, not tokens.

## Two levels

| Level | Purpose | Name ends in… | Example |
|---|---|---|---|
| **Primitive** | A raw value with no interface role | a scale or hue step | `--color-neutral-700`, `--spacing-4`, `--radius-2` |
| **Semantic** | What the value is *for* in the interface | a role | `--color-text-secondary`, `--spacing-grid-column`, `--radius-card-l` |

Rules:

1. A semantic token always references a primitive. It never holds a raw value, and it never references another semantic token.
2. Components use a semantic token when one exists for that role.
3. Components may use a primitive directly when a semantic alias would add nothing. Examples: the case-evaluation hues and the 8px radius on case-study blocks.
4. Add a token only when a value is reused or carries a design decision. One-off values stay hardcoded.
5. Token names never encode page content, copy or HTML structure. For example, it's `--spacing-paragraph`, not `--spacing-paragraph-case-study`.

## Naming rules

General form: `--{category}-{…}`, lowercase, kebab-case, singular, no abbreviations except size steps.

### Primitives

| Category | Pattern | Steps |
|---|---|---|
| Color | `--color-{hue}-{step}` | `0`–`950`, lighter → darker |
| Spacing | `--spacing-{n}` | n × 4px (`--spacing-4` = 16px) |
| Radius | `--radius-{n}` · `--radius-full` | n × 4px (`--radius-2` = 8px) |
| Font family | `--font-family-{kind}` | `serif`, `sans`, `mono` |
| Font size | `--font-size-{step}` | `xs`, `s`, `m`, `l`, `xl`, `2xl`, `3xl` |
| Font weight | `--font-weight-{name}` | `regular`, `medium` |
| Size | `--size-{thing}[-{step}]` | `s`, `m`, `l` (same steps as font size) |
| Motion | `--duration-{speed}` · `--easing-{curve}` | `base`, `medium`, `slow` · `out` |

### Semantics

| Category | Pattern | Example |
|---|---|---|
| Color (global) | `--color-{property}-{role}` | `--color-text-tertiary`, `--color-background-inverse` |
| Color (component) | `--color-{component}-{variant}-{property}-{state}` | `--color-button-primary-background-hover` |
| Spacing | `--spacing-{role}[-{axis}]` | `--spacing-container-inline` |
| Radius | `--radius-{component}[-{size}]` | `--radius-card-s`, `--radius-button-primary` |

Vocabulary:

- **Properties:** `background`, `text`, `outline`.
- **Roles:** `primary`, `secondary`, `tertiary`, `inverse`, `placeholder`.
- **States:** `default`, `hover`, `active`. Use `active` for selected or pressed, not `selected`.
- **Components:** `button`, `tag`, `card`, `chip`. In token names, `chip` means the round arrow badge on project cards (`.chip`), and `tag` means a static label (`.case-header__tag`).

### Breakpoints

Custom properties don't work inside `@media`, so breakpoints stay literal: **480px · 640px · 768px · 1024px**.

## Inventory

### Primitives

| Token | Value | Used by |
|---|---|---|
| `--color-neutral-0` | #FFFFFF | background-primary, text-inverse, button text active |
| `--color-neutral-50` | #F7F7F7 | background-secondary |
| `--color-neutral-100` | #EBEBEB | background-placeholder, tag, button default |
| `--color-neutral-200` | #DEDEDE | outline-primary, button hover |
| `--color-neutral-600` | #737373 | text-tertiary |
| `--color-neutral-700` | #535353 | text-secondary |
| `--color-neutral-950` | #121212 | text-primary, background-inverse, button active / text |
| `--color-green-100` | #DDFEA6 | `.case-evaluation__card--positive` (direct) |
| `--color-blue-50` | #E7F8FF | `.case-note` (direct) |
| `--color-blue-100` | #D1F1FE | `.case-evaluation__card--negative` (direct) |
| `--spacing-1 … -24` | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96px | everywhere |
| `--radius-1` | 4px | archive row marker |
| `--radius-2` | 8px | figures, case-study blocks, nav links, tags, lightbox |
| `--radius-4` | 16px | `--radius-card-s` |
| `--radius-8` | 32px | `--radius-card-l` |
| `--radius-full` | 9999px | `--radius-chip`, tag-filter |
| `--font-family-serif / sans / mono` | Sentient / Geist / Geist Mono | captions & quotes / body / labels |
| `--font-size-xs … 3xl` | 14, 16, 18, 20, 24, 32, 56px | everywhere |
| `--font-weight-regular / medium` | 400 / 500 | headings, body / active nav, index, strong |
| `--size-icon-s / m / l` | 20 / 24 / 32px | icons in round buttons / chip & view toggle / footer "Up" |
| `--size-button-icon` | 36px | round icon-only buttons (expand, play, close, carousel) |
| `--size-header-height` | 64px | header, sticky offsets, mobile menu |
| `--size-content-max` | 1440px | content width of `.container` and the case-study grid (`.case__layout`); gutters added on top |
| `--duration-base` | 220ms | UI state transitions (hover colour, small reveals) |
| `--duration-medium` | 300ms | elements that expand or appear over media: card chip, Archive cursor preview |
| `--duration-slow` | 400ms | media hover (image zoom, card radius) |
| `--easing-out` | cubic-bezier(0.22, 1, 0.36, 1) | paired with `--duration-base` |

### Semantics

| Token | → Primitive | Role |
|---|---|---|
| `--color-background-primary` | neutral-0 | page, header, round buttons, chip |
| `--color-background-secondary` | neutral-50 | nav hover, insight cards |
| `--color-background-placeholder` | neutral-100 | media while loading |
| `--color-background-inverse` | neutral-950 | selected tag-filter |
| `--color-outline-primary` | neutral-200 | dividers and borders |
| `--color-text-primary / secondary / tertiary` | neutral-950 / 700 / 600 | text hierarchy, focus ring, markers |
| `--color-text-inverse` | neutral-0 | text on inverse backgrounds |
| `--color-button-primary-background-{default,hover,active}` | neutral-100 / 200 / 950 | `.button-primary` |
| `--color-button-primary-text-{default,active}` | neutral-950 / 0 | `.button-primary` |
| `--color-tag-background` | neutral-100 | `.case-header__tag` |
| `--spacing-container-inline / block` | spacing-10 / 6 | page gutters |
| `--spacing-grid-column / row` | spacing-4 / 6 | grid gaps |
| `--spacing-paragraph` | spacing-5 | space after text blocks in case studies |
| `--spacing-figure-gap` | spacing-5 | gap between figures in a case-study media group (`.case-section__media`) |
| `--spacing-media-block` | spacing-8 | space before and after a case-study media group |
| `--radius-card-l` | radius-8 (32px) | large cards: half the grid or wider (home featured) |
| `--radius-card-s` | radius-4 (16px) | small cards: a third of the grid or narrower (archive grid, related work, cursor preview) |
| `--radius-chip` | radius-full | `.chip` |
| `--radius-button-primary` | radius-2 | `.button-primary` |

## Adding a token

1. Check that an existing token doesn't already cover the value.
2. If the value is foundational, add a primitive with the matching pattern, in scale order.
3. Add a semantic token only if the value has a role that is reused, or that you might restyle on its own. It must point at a primitive.
4. Mirror the name in the Figma collections (`_Primitives_Color`, `_Primitives_Number`, `Semantics_Color`, `Semantics_Radius`).
