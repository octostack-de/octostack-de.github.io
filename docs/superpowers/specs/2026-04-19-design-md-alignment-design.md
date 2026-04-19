# DESIGN.md Alignment — Styling Refactor

**Date:** 2026-04-19
**Branch:** `style/design-md-alignment`
**Scope:** Styling-only. No content, copy, section-structure, or feature changes.

## Goal

Bring the visual system of the Octostack marketing site in line with the Apple-inspired design system described in `DESIGN.md`, while preserving the Octostack ocean-blue brand accent (`#3b7ea1`) instead of adopting Apple blue. The outcome is a measurable lift in perceived quality — typography discipline, monochrome rhythm, restrained chrome — without any copy, structural, or marketing changes.

This is the first of several planned branches. Copy rework, Impressum/DSGVO, German localization, lead capture, and trust signals are explicit non-goals here and will be tracked as separate branches.

## Design Decisions (locked)

Five decisions were agreed through brainstorming before this spec was written:

1. **Scope:** Styling tokens + component visuals + section background rhythm only. No content, no restructuring.
2. **Approach:** Adopt DESIGN.md discipline (typography, tight tracking, pill CTAs, black ↔ light-gray rhythm, restrained chrome, no decorative gradients) but substitute Octostack ocean blue for Apple blue as the single accent. Warm orange is removed from UI chrome entirely; it survives only inside the logo PNG.
3. **Typography:** Self-hosted Inter variable font. DSGVO-safe (no Google Fonts), consistent across all platforms, ~150KB one-time load.
4. **Section rhythm:** "Cinematic" — three dark anchors (hero, one mid-page section, footer) punctuating a calm white ↔ light-gray body.
5. **Navigation:** Light translucent glass (`rgba(255,255,255,0.8)` + saturate/blur). Existing logo PNG works as-is on light nav and dark footer.

## Design Tokens

### Colors (Tailwind config)

```js
colors: {
  ink: {
    900: '#000000',              // hero bg, dark anchor bg
    800: '#1d1d1f',              // primary text on light, footer bg
    700: 'rgba(0, 0, 0, 0.8)',   // nav links, secondary text on light
    600: 'rgba(0, 0, 0, 0.48)',  // tertiary text
  },
  paper: {
    50:  '#ffffff',              // base white sections
    100: '#f5f5f7',              // alternate light section bg
    200: '#ededf2',              // hover/active surface
  },
  darksurf: {
    1: '#272729',                // card bg inside dark sections
    2: '#262628',
    3: '#28282a',
  },
  brand: {
    500: '#3b7ea1',              // primary accent (from current `primary-500`)
    600: '#2e6580',              // hover
    700: '#244d61',              // active
    link:     '#2e6580',         // text links on light bg
    darklink: '#4aa9c8',         // text links on dark bg (higher luminance)
  },
}
```

`accent` (warm orange) is **deleted** from the Tailwind config. No CSS class in the project references orange after this change. The logo PNG is the only surviving orange surface.

`primary` and `secondary` scales are **deleted**; anywhere they were used is remapped to `ink`/`paper`/`brand`.

### Typography

- **Font:** Inter (variable), self-hosted at `assets/fonts/InterVariable.woff2`
- **Tailwind `fontFamily.sans`:** `['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif']`
- **Global rule (in `src/css/input.css`):** `body { letter-spacing: -0.01em; }` — DESIGN.md's "tight tracking at every size" principle
- **Weights used:** 400 (regular) and 600 (semibold) only. No 700+ bold. Inter variable covers both.
- **Scale (applied via Tailwind utilities on specific elements):**

  | Role | Classes |
  |---|---|
  | Display hero | `text-5xl md:text-6xl font-semibold leading-[1.07] tracking-[-0.02em]` |
  | Section heading | `text-4xl md:text-5xl font-semibold leading-[1.1]` |
  | Sub-section heading | `text-3xl font-semibold leading-[1.1]` |
  | Card title | `text-xl font-semibold leading-[1.19]` |
  | Body lead | `text-lg md:text-xl leading-[1.5]` |
  | Body | `text-base leading-[1.5]` |
  | Nav link | `text-sm font-normal` |

### Spacing, Radius, Shadows

- **Spacing:** Tailwind defaults (8px base, matches DESIGN.md).
- **Border radius:** use Tailwind defaults — no config extension needed
  - `rounded-md` (6px) — cards, icon chips
  - `rounded-lg` (8px) — buttons
  - `rounded-full` (9999px) — pill CTAs
  - Existing `rounded-xl` (12px) on service cards → replaced with `rounded-md` (6px)
- **Shadows (Tailwind extend):**
  - `shadow-card: 0 5px 30px rgba(0,0,0,0.12)` — single soft card shadow
  - Delete all `shadow-lg shadow-primary-600/30` decorative glows
- **Focus rings:** `focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:outline-none`

## Components

### Primary CTA (filled pill)
```
inline-flex items-center gap-2 px-6 py-3 text-base font-normal
rounded-full text-white bg-brand-500
hover:bg-brand-600 transition-colors
focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:outline-none
```
No shadow. Hover = color transition only.

### Secondary CTA (outline pill)
```
inline-flex items-center gap-2 px-6 py-3 text-base font-normal
rounded-full text-brand-500 border border-brand-500
hover:bg-brand-500 hover:text-white transition-colors
focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:outline-none
```
Fills on hover. No pastel hover background.

### "Learn more" inline link
```
inline-flex items-center gap-1 text-sm text-brand-link
hover:underline
```
Add trailing Lucide `chevron-right` icon at `w-4 h-4`. On dark sections swap `text-brand-link` → `text-brand-darklink`.

### Service card (light section, `bg-white`)
```
bg-paper-100 rounded-md p-8 shadow-card
```
- No border.
- No hover state on the card itself (card is static per DESIGN.md).
- Icon chip: `w-12 h-12 rounded-md bg-brand-500/10 text-brand-500 flex items-center justify-center`
- Card title: `text-xl font-semibold leading-[1.19] mb-2 text-ink-800`
- Description: `text-ink-700 mb-4`
- Feature list: preserve structure, swap check icon to `text-brand-500`, tighten to `space-y-1.5`

### Service card (light-gray section, `bg-paper-100`)
Same as above but swap card bg `bg-paper-100` → `bg-white` for contrast flip.

### Service card (dark section, `bg-ink-900`)
```
bg-darksurf-1 rounded-md p-8
```
- No shadow (depth comes from bg contrast).
- Title white, description `text-white/80`.
- Feature check icons `text-brand-darklink`.

### Navigation (light glass)
```
sticky top-0 z-50
bg-white/80 backdrop-blur-[20px] backdrop-saturate-[180%]
border-b border-black/5
```
- No shadow.
- Height unchanged (`h-20 md:h-24`).
- Nav links: `text-ink-700 hover:text-ink-800 text-sm font-normal transition-colors`. No underline animation.
- Mobile menu panel: same white/80 treatment, no border.

### Footer (dark anchor)
```
bg-ink-800 text-white/70
```
- Heading/links use the tokens above.
- **Twitter icon and its anchor are removed** — no active Twitter presence, empty link hurts trust. This is the single minor content-side exception called out and approved during brainstorming; no other content changes in this branch.
- LinkedIn + GitHub links: `hover:text-white transition-colors` (no brand-color hover)

### Hero icon pill (removed)
The current decorative gradient icon pill at the top of the hero (a 16×16 rounded square containing a cloud icon) is removed. The hero leads with the headline directly. No replacement asset needed.

## Section Rhythm Map

| # | Section (`id` in index.html) | New bg token | Key visual delta |
|---|---|---|---|
| 1 | Hero (`#home`) | `bg-ink-900` | Remove pastel gradient + 2 blur blobs + gradient-text. Headline → solid white. Remove decorative icon pill. CTAs swap to new pill components. |
| 2 | Services overview (`#services`) | `bg-paper-100` | Kill `text-gradient` on heading. Three cards get new static treatment. |
| 3 | Specialized infrastructure (no `id`) | `bg-paper-50` (white) | Cards on `bg-paper-100` with `shadow-card`. |
| 4 | Development & ops | `bg-paper-100` | Contrast flip: cards on `bg-white`. |
| 5 | Architecture advisory (mid-page dark anchor) | `bg-ink-900` | Cards on `bg-darksurf-1`. Text white, links `brand-darklink`. |
| 6 | About (`#about`) | `bg-paper-50` | Remove pastel gradient bg. Kill `text-gradient` on heading. |
| 7 | Values | `bg-paper-100` | Card treatment. |
| 8 | Contact (`#contact`) | `bg-paper-50` | Kill `text-gradient` on heading. Cards on `bg-paper-100`. Icon chips switch from pastel `bg-primary-100` to `bg-brand-500/10`. |
| — | Footer | `bg-ink-800` | Natural third dark anchor. See component spec. |

Three dark moments spaced roughly evenly (top, middle, bottom). Five light/white moments handle the bulk of the reading flow.

## File Changes

| File | Type | Change |
|---|---|---|
| `tailwind.config.js` | edit | Rewrite `theme.extend.colors` (delete `primary`/`secondary`/`accent`, add `ink`/`paper`/`brand`/`darksurf`). Set `fontFamily.sans` to Inter stack. Extend `boxShadow` with `card`. Border-radius uses Tailwind defaults (no extend needed). |
| `src/css/input.css` | edit | Remove `.text-gradient` utility. Add `@font-face` for `Inter` loading `/assets/fonts/InterVariable.woff2`. Add `body { letter-spacing: -0.01em; }` |
| `assets/fonts/InterVariable.woff2` | **new** | Inter variable font, downloaded from the official Inter release (rsms.me/inter). Committed to the repo. |
| `_layouts/default.html` | edit | Add `<link rel="preload" as="font" type="font/woff2" href="{{ '/assets/fonts/InterVariable.woff2' | relative_url }}" crossorigin>` in `<head>`. |
| `_includes/header.html` | edit | Apply new nav classes. Remap color classes from `secondary-*`/`primary-*` → `ink-*`/`brand-*`. |
| `_includes/footer.html` | edit | Apply new footer classes. Remove Twitter icon and its `<a>` wrapper. Remap color tokens. |
| `_includes/service-card.html` | edit | Apply new card classes. Remove border, hover-lift, hover-shadow. Remap icon chip styling. |
| `index.html` | edit | Per-section rewrite: replace section bg classes per the rhythm map; remove `bg-gradient-to-*`, `blur-3xl`, `text-gradient`; remap color classes throughout. Content text is not modified. |
| `assets/js/main.js` | edit | Active-nav-link highlighting uses `text-primary-600` / `text-secondary-600` (lines 46–50); remap to `text-ink-800` (active) / `text-ink-700` (default). Subtle, non-chromatic active state matches DESIGN.md's restrained nav. |

Zero file deletions. The `src/` directory must stay tracked (verified earlier in session; `.gitignore` now tracks it correctly).

## Branch Strategy

- **Branch name:** `style/design-md-alignment`
- **Base:** `main`
- **Merge strategy:** standard PR with squash merge
- **Deployment:** on merge to `main`, the existing `.github/workflows/deploy.yml` pushes `_site/` to the public Pages repo automatically.

## Implementation Sequence

1. Create branch `style/design-md-alignment`.
2. Download Inter variable woff2; commit to `assets/fonts/`.
3. Add `@font-face` + global tight tracking to `src/css/input.css`. Remove `.text-gradient`.
4. Rewrite `tailwind.config.js` token block.
5. Add font preload hint in `_layouts/default.html`.
6. Rewrite `_includes/header.html`.
7. Rewrite `_includes/footer.html` (including Twitter removal).
8. Rewrite `_includes/service-card.html`.
9. Rewrite `index.html` section-by-section in the rhythm-map order.
10. Run `npm run dev`; walk through every section in the browser at desktop and mobile widths; fix any visual regressions. Pay attention to: nav contrast on scroll through dark sections, card shadows on light-gray, focus rings on all interactive elements.
11. Commit in logical chunks (tokens, components, sections). Open PR against `main`.

## Success Criteria

- `grep -r 'text-gradient\|bg-gradient-to\|blur-3xl\|accent-\|primary-\|secondary-' index.html _includes _layouts src/css` returns zero matches after the refactor.
- No `shadow-lg` or `hover:-translate-y` classes remain.
- The `accent` color key is absent from `tailwind.config.js`.
- Visual verification in browser: hero is black with white type, one mid-page section is black, footer is dark; the rest is a white ↔ light-gray rhythm; only blue (brand-500 variants) appears as a chromatic accent in any rendered pixel outside the logo.
- Build still passes: `npm run build` exits 0 and emits `_site/assets/css/main.css` with the new tokens compiled in.
- Deploy workflow still green after merge.

## Explicit Non-Goals (deferred to later branches)

- Copy rework (hero headline, CTA labels, service descriptions)
- Section restructuring (duplicate "Contact Details" H3, duplicated service overview, 9 → fewer services)
- Impressum / Datenschutzerklärung pages
- German localization
- Lead capture (Cal.com, contact form)
- New trust signals (client logos, certifications, case studies)
- Logo revision / monochrome variant
- Adaptive dark/light nav (future upgrade per Q4 discussion)
