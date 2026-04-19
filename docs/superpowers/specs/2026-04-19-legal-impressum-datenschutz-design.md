# Legal — Impressum & Datenschutzerklärung

**Date:** 2026-04-19
**Branch:** `legal/impressum-datenschutz`
**Scope:** Add `/impressum/` (TMG §5) and `/datenschutz/` (DSGVO art. 13) pages, link from footer, and eliminate third-party data transfer (self-host Lucide) so the Datenschutz disclosure stays minimal and accurate. No copy/structure changes elsewhere.

## Goal

Make the Octostack marketing site legally publishable for the German market. Without an Impressum the site violates TMG §5; without a Datenschutzerklärung that honestly discloses every data flow it violates DSGVO art. 13. Both pages exist solely to satisfy these obligations — they are not marketing surfaces and do not get hero treatment.

A precondition for an honest Datenschutz is that no third-party request leaves the visitor's browser without disclosure. Today the site loads Lucide from `unpkg.com` (`_layouts/default.html:14`), which is a US-based CDN that learns the visitor's IP. The Datenschutz could disclose this, but self-hosting is cleaner, faster, removes a runtime dependency, and lets the Datenschutz say "no third-party transfer beyond the hosting provider." Self-hosting Lucide is therefore in scope for this branch.

This is the first of several planned content branches (see `docs/superpowers/plans/` and the improvement plan in conversation history). Copy rework, German localization of marketing pages, lead capture, and trust signals are explicit non-goals here and tracked as separate branches.

## Design Decisions (locked)

Eight decisions for this branch:

1. **Scope:** Two new legal pages + footer links + self-host Lucide + a minimal `legal` layout. Nothing else.
2. **Language: German only.** Impressum is a legal document under German law (TMG §5) and the canonical version must be German for a `.de` domain serving a German market. The Datenschutz follows the same convention. A short English helper line at the top of each page tells English readers why the page is German. When Branch 5 (i18n) lands, the legal pages stay German — they are already in canonical form.
3. **Routing:** Clean URLs `/impressum/` and `/datenschutz/` via Jekyll `permalink:` front matter. Files live in `_pages/` (already in `_config.yml:43-44 include:`).
4. **Layout:** New `_layouts/legal.html` chains from `default.html` and provides a long-form reading container (`max-w-3xl`, paper-50 background, no hero, no marketing chrome). Typography is handled by a small `.legal-prose` component class added to `src/css/input.css` so the markdown stays clean (no inline Tailwind classes in long prose).
5. **Self-host Lucide:** Replace `<script src="https://unpkg.com/lucide@latest">` with a pinned, committed `assets/js/lucide.min.js`. Pin a specific Lucide release (not `@latest`) so updates are intentional and the `integrity` of what we serve is reproducible. Use `defer` so the icons script doesn't block the parser.
6. **Footer links:** Add Impressum + Datenschutzerklärung as text links in a thin row above the copyright line. No icon, no separator chrome — just two underlined-on-hover links inheriting footer typography. Both link rows (quick-links column and the new legal row) keep the same styling so legal links don't shout.
7. **Cleanup spillover:** Remove the orphan `social.twitter` key from `_config.yml:15` — the footer no longer references it after the design-md-alignment branch removed the Twitter icon. Removing it from config is the matching cleanup so future authors don't reintroduce the link.
8. **No new design primitives.** The legal pages reuse existing tokens (`ink`, `paper`, `brand`). The only addition is the `.legal-prose` typography component, which is a typography concern (not decoration) and is consistent with the design-md-alignment spec's restraint principles.

## Required User Inputs (must be supplied before implementation)

The spec uses `{{TOKEN}}` placeholders for facts only the site owner can confirm. **All tokens must be filled in by Liang Shi before the implementation plan is executed.** Wrong or missing legal data is worse than no Impressum at all.

### For the Impressum (TMG §5)

| Token | What it is | Notes |
|---|---|---|
| `{{LEGAL_NAME}}` | Full legal name as registered | If Einzelunternehmer / Freiberufler: just the personal name (e.g. "Liang Shi"). If GmbH/UG: registered company name. |
| `{{STREET_ADDRESS}}` | Street + house number | Berlin street address |
| `{{POSTAL_CODE_CITY}}` | PLZ + city | e.g. "10115 Berlin" |
| `{{COUNTRY}}` | Country | "Deutschland" |
| `{{PHONE}}` | Telephone | Required under TMG §5(1) Nr. 2. A mobile is fine. A real number is required — no PO box, no "on request". |
| `{{EMAIL}}` | Contact email | Already known: `hello@octostack.de` |
| `{{BUSINESS_FORM}}` | Legal form | One of: Einzelunternehmer / Freiberufler nach §18 EStG / GbR / GmbH / UG (haftungsbeschränkt) / other. Determines which extra blocks render. |
| `{{VAT_ID}}` | USt-IdNr. (if applicable) | If VAT-registered (USt-IdNr. issued by Bundeszentralamt für Steuern). If Kleinunternehmer per §19 UStG, leave empty and the page renders the Kleinunternehmer notice instead. |
| `{{HRB_REGISTRATION}}` | Handelsregister entry | Only for GmbH/UG: e.g. "HRB 123456 B, Amtsgericht Berlin-Charlottenburg". Empty for Einzelunternehmer/Freiberufler. |
| `{{MANAGING_DIRECTOR}}` | Geschäftsführer | Only for GmbH/UG. Empty otherwise. |
| `{{RESPONSIBLE_PERSON}}` | Verantwortlich nach §18 (2) MStV | Person responsible for content. Defaults to `{{LEGAL_NAME}}` + `{{STREET_ADDRESS}}` if site has any editorial content. A pure marketing site arguably doesn't need this, but including it costs nothing and avoids judgment calls. |

### For the Datenschutzerklärung (DSGVO art. 13)

| Token | What it is | Notes |
|---|---|---|
| `{{CONTROLLER}}` | Verantwortlicher | Same identity as Impressum. The page reuses the same name/address block. |
| `{{PRIVACY_EMAIL}}` | Email for privacy requests | Default: same as `{{EMAIL}}`. Some controllers prefer a separate `datenschutz@…` alias. |
| `{{HOSTING_PROVIDER}}` | Where the site is hosted | Pre-filled: "GitHub Pages, betrieben durch GitHub, Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA. Datenübermittlung in die USA auf Grundlage der EU-Standardvertragsklauseln (SCCs) und des EU–US Data Privacy Framework, dem GitHub beigetreten ist." |
| `{{LOG_RETENTION}}` | Server-log retention by host | Pre-filled per GitHub's published policy at time of writing: "Server-Logfiles werden durch den Hosting-Provider GitHub für maximal 30 Tage zur Sicherstellung des Betriebs gespeichert und danach automatisch gelöscht." If GitHub's published retention changes, update this string. |
| `{{SUPERVISORY_AUTHORITY}}` | Aufsichtsbehörde | Pre-filled (Berlin): "Berliner Beauftragte für Datenschutz und Informationsfreiheit, Alt-Moabit 59-61, 10555 Berlin, https://www.datenschutz-berlin.de". Update if Octostack relocates outside Berlin. |

### Standing facts (no input needed)
- Site sets **no cookies** (verified by inspecting the build).
- Site uses **no analytics** (no Google Analytics, no Plausible, no Matomo).
- Site uses **no embedded media** (no YouTube, no Vimeo, no Twitter widgets).
- Site uses **no contact form** at the time of this branch (Branch 6 will add lead capture; the Datenschutz must be updated at that time, not now).
- Site uses **no third-party fonts** (Inter is self-hosted under `assets/fonts/`).
- After this branch, site uses **no third-party JavaScript** (Lucide self-hosted).

## Page Content (German, structured)

### `/impressum/` — content blocks

In document order:

1. **English helper note** (one line at the top, italic, smaller): *"Pursuant to German law (§5 TMG, §18 MStV) the imprint is provided in German."*
2. **`<h1>` Impressum**
3. **`<h2>` Angaben gemäß §5 TMG**
   - `{{LEGAL_NAME}}`
   - `{{STREET_ADDRESS}}`
   - `{{POSTAL_CODE_CITY}}`, `{{COUNTRY}}`
4. **`<h2>` Kontakt**
   - Telefon: `{{PHONE}}`
   - E-Mail: `{{EMAIL}}` (as a `mailto:` link)
5. **`<h2>` Umsatzsteuer-ID** *(rendered only if `{{VAT_ID}}` is set)*
   - "Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz: `{{VAT_ID}}`"
6. **`<h2>` Kleinunternehmerregelung** *(rendered only if `{{VAT_ID}}` is empty AND `{{BUSINESS_FORM}}` ∈ {Einzelunternehmer, Freiberufler})*
   - "Gemäß §19 UStG wird keine Umsatzsteuer berechnet."
7. **`<h2>` Handelsregister** *(rendered only if `{{BUSINESS_FORM}}` ∈ {GmbH, UG})*
   - Registergericht + HRB: `{{HRB_REGISTRATION}}`
   - Geschäftsführer: `{{MANAGING_DIRECTOR}}`
8. **`<h2>` Verantwortlich für den Inhalt nach §18 Abs. 2 MStV**
   - `{{RESPONSIBLE_PERSON}}` (name + address)
9. **`<h2>` EU-Streitschlichtung**
   - Standard paragraph linking to https://ec.europa.eu/consumers/odr/ and stating that Octostack is not obligated and not willing to participate in consumer-arbitration proceedings (boilerplate; the same text appears on virtually every German B2B site).

### `/datenschutz/` — content blocks

In document order:

1. **English helper note** (one line at the top, italic): *"Pursuant to GDPR Art. 13 the privacy notice is provided in German."*
2. **`<h1>` Datenschutzerklärung**
3. **`<h2>` 1. Verantwortlicher**
   - `{{CONTROLLER}}` block (name, address, email)
4. **`<h2>` 2. Erhebung allgemeiner Informationen beim Besuch dieser Website**
   - One paragraph stating that the site is purely informational, sets no cookies, runs no analytics, and the only data processed is the technical access information necessary for delivery (IP address, user agent, timestamp, requested URL). Legal basis: art. 6 (1) lit. f DSGVO (legitimate interest in delivering the site). Storage is by the hosting provider only; see §3.
5. **`<h2>` 3. Hosting**
   - `{{HOSTING_PROVIDER}}` block.
   - `{{LOG_RETENTION}}` sentence.
6. **`<h2>` 4. Schriftarten und Icons**
   - One paragraph confirming Inter font and Lucide icons are self-hosted from the same domain — no requests to third-party CDNs (Google Fonts, unpkg, jsDelivr, etc.) occur.
7. **`<h2>` 5. Cookies**
   - One sentence: "Diese Website verwendet keine Cookies." If this changes (e.g. Branch 6 lead capture), this section is updated.
8. **`<h2>` 6. Kontaktaufnahme per E-Mail**
   - One paragraph: when a visitor contacts via the email address in the Impressum, the message and reply chain are stored to handle the request. Legal basis: art. 6 (1) lit. b DSGVO (pre-contractual measures) or lit. f. Retention: until the inquiry is closed plus statutory retention periods.
9. **`<h2>` 7. Ihre Rechte**
   - Bulleted list of DSGVO rights: Auskunft (art. 15), Berichtigung (art. 16), Löschung (art. 17), Einschränkung (art. 18), Datenübertragbarkeit (art. 20), Widerspruch (art. 21). One contact line directing requests to `{{PRIVACY_EMAIL}}`.
10. **`<h2>` 8. Beschwerderecht bei der Aufsichtsbehörde**
    - `{{SUPERVISORY_AUTHORITY}}` block.
11. **`<h2>` 9. Aktualität dieser Datenschutzerklärung**
    - One sentence: "Stand: {{DATE}}. Diese Datenschutzerklärung wird bei Änderungen am Angebot oder an gesetzlichen Vorgaben angepasst." `{{DATE}}` is filled at commit time (e.g. "April 2026").

## Components

### `_layouts/legal.html`

```html
---
layout: default
---
<section class="bg-paper-50 py-16 md:py-24">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <article class="max-w-3xl mx-auto">
            {% if page.helper_en %}
            <p class="text-sm italic text-ink-600 mb-6">{{ page.helper_en }}</p>
            {% endif %}
            <h1 class="text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.02em] text-ink-800 mb-10">
                {{ page.title }}
            </h1>
            <div class="legal-prose">
                {{ content }}
            </div>
        </article>
    </div>
</section>
```

- `helper_en` is a per-page front-matter string holding the one-line English note.
- The `<h1>` uses the Section heading scale from the design-md-alignment spec (`text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.02em]`).
- The `.legal-prose` wrapper applies the typography rules below to the rendered markdown.

### `.legal-prose` typography (added to `src/css/input.css`)

```css
@layer components {
    .legal-prose h2 {
        @apply text-2xl font-semibold leading-[1.19] text-ink-800 mt-12 mb-4;
    }
    .legal-prose h3 {
        @apply text-xl font-semibold leading-[1.19] text-ink-800 mt-8 mb-3;
    }
    .legal-prose p {
        @apply text-base leading-[1.5] text-ink-700 mb-4;
    }
    .legal-prose ul {
        @apply list-disc pl-6 mb-4 space-y-1;
    }
    .legal-prose ul li {
        @apply text-base leading-[1.5] text-ink-700;
    }
    .legal-prose a {
        @apply text-brand-link hover:underline transition-colors;
    }
    .legal-prose strong {
        @apply font-semibold text-ink-800;
    }
}
```

No `.legal-prose h1` rule — the `<h1>` is rendered by the layout, not the markdown.

### Footer addition (`_includes/footer.html`)

Insert immediately above the existing `<!-- Copyright -->` block:

```html
<!-- Legal Links -->
<nav class="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-center gap-x-6 gap-y-2 text-sm" aria-label="Legal">
    <a href="{{ '/impressum/' | relative_url }}" class="hover:text-white transition-colors">Impressum</a>
    <a href="{{ '/datenschutz/' | relative_url }}" class="hover:text-white transition-colors">Datenschutzerklärung</a>
</nav>
```

The existing copyright block then drops its own `mt-12 pt-8 border-t border-white/10` (those classes move to the new legal nav above it) and becomes:

```html
<!-- Copyright -->
<div class="mt-6 text-center text-sm">
    <p>&copy; <span id="current-year"></span> {{ site.company.name }}. All rights reserved.</p>
</div>
```

This way the divider line sits above the legal links, and the copyright sits beneath them with normal spacing — one visual group of three rows (links, links, copyright) instead of two divided rows.

### Self-hosted Lucide

`_layouts/default.html:14` changes from:

```html
<script src="https://unpkg.com/lucide@latest"></script>
```

to:

```html
<script src="{{ '/assets/js/lucide.min.js' | relative_url }}" defer></script>
```

The `lucide.createIcons()` call in `_layouts/default.html:28` must move from inline-after-script to a `DOMContentLoaded` listener, because `defer` delays execution past the inline call site:

```html
<script>
    document.addEventListener('DOMContentLoaded', function () {
        lucide.createIcons();
    });
</script>
```

`assets/js/lucide.min.js` is downloaded from a pinned Lucide release (the implementation plan specifies the exact version and URL). Committed to the repo. File size budget: under 100 KB minified.

## File Changes

| File | Type | Change |
|---|---|---|
| `_pages/impressum.md` | **new** | Jekyll page. Front matter: `layout: legal`, `permalink: /impressum/`, `title: Impressum`, `helper_en: …`. Body is German markdown per the content-blocks section above with `{{TOKEN}}` placeholders filled in. |
| `_pages/datenschutz.md` | **new** | Jekyll page. Front matter: `layout: legal`, `permalink: /datenschutz/`, `title: Datenschutzerklärung`, `helper_en: …`. Body is German markdown per the content-blocks section above. |
| `_layouts/legal.html` | **new** | Long-form reading layout chained from `default.html`. Renders `helper_en`, `<h1>`, then `{{ content }}` inside `.legal-prose`. |
| `src/css/input.css` | edit | Append the `.legal-prose` component block. No removals. |
| `_includes/footer.html` | edit | Insert the legal-links nav above copyright; rebalance divider classes per the component spec. |
| `_layouts/default.html` | edit | Replace `<script src="https://unpkg.com/lucide@latest"></script>` with the self-hosted `defer` script. Move the `lucide.createIcons()` invocation into a `DOMContentLoaded` listener. |
| `assets/js/lucide.min.js` | **new** | Pinned Lucide release. The implementation plan specifies version + checksum. |
| `_config.yml` | edit | Remove the `social.twitter` key (orphan after design-md-alignment removed the footer Twitter icon). |

Zero file deletions. Zero changes to `index.html`, `_data/*`, `_includes/header.html`, `_includes/service-card.html`, `tailwind.config.js`, or `assets/js/main.js`.

## Branch Strategy

- **Branch name:** `legal/impressum-datenschutz`
- **Base:** `main`
- **Merge strategy:** standard PR with squash merge.
- **Deployment:** on merge to `main`, the existing `.github/workflows/deploy.yml` pushes `_site/` to the public Pages repo automatically. The new `/impressum/` and `/datenschutz/` URLs become live within minutes of merge.

## Implementation Sequence (high level)

The detailed step-by-step plan is in `docs/superpowers/plans/2026-04-19-legal-impressum-datenschutz.md` (to be written after this spec is approved). High-level order:

1. Confirm all `{{TOKEN}}` values with the site owner. Block here until every token has a real answer.
2. Create branch `legal/impressum-datenschutz`.
3. Pin and download Lucide; commit `assets/js/lucide.min.js`.
4. Update `_layouts/default.html` to self-hosted Lucide + DOMContentLoaded init. Verify icons still render.
5. Add `.legal-prose` component to `src/css/input.css`.
6. Create `_layouts/legal.html`.
7. Create `_pages/impressum.md` with all tokens substituted.
8. Create `_pages/datenschutz.md` with all tokens substituted.
9. Update `_includes/footer.html` to insert the legal-links row.
10. Remove `social.twitter` from `_config.yml`.
11. `npm run build`; visit `/impressum/`, `/datenschutz/`, and `/` in a browser; verify network tab shows zero requests to third-party hosts (no `unpkg`, no `googleapis`, no analytics).
12. Open PR against `main`.

## Success Criteria

- `npm run build` exits 0.
- `_site/impressum/index.html` and `_site/datenschutz/index.html` exist and contain the German content blocks specified above with all tokens substituted.
- Footer on every page (`_site/index.html`, `_site/impressum/index.html`, `_site/datenschutz/index.html`) contains links to both `/impressum/` and `/datenschutz/`.
- `grep -rE 'unpkg|cdn\.jsdelivr|googleapis|gtag|fbq|analytics' _site` returns zero matches.
- Browser DevTools network tab on a fresh load of `/impressum/` shows requests only to `octostack.de` (or `localhost:4000` in dev). No third-party hosts.
- Lucide icons render correctly on `/` (verify the Quick Links / contact icons).
- The `social.twitter` key is absent from `_config.yml`.
- No `{{TOKEN}}` placeholder string remains in any rendered HTML.
- Each Impressum-required field per TMG §5 is present (name, address, contact, VAT/Kleinunternehmer block, responsible person).
- Each DSGVO art. 13 disclosure is present (controller, processing purposes, legal basis, hosting, retention, rights, supervisory authority).

## Explicit Non-Goals (deferred to later branches)

- English versions of the legal pages (Branch 5 — `i18n/german-locale`. German is the canonical legal version; the English mirror, if added, is a courtesy translation marked as non-binding.)
- Cookie banner / consent modal (no cookies are set; nothing to consent to).
- Analytics opt-out controls (no analytics).
- Linking from the main hero or top nav (legal pages are footer-only by convention; promoting them above the fold is unusual and reads as defensive).
- Restructuring `_includes/footer.html` beyond inserting the legal-links row.
- AGB / Widerruf / Pricing pages (not required for a B2B marketing site without e-commerce).
- Changing how Branch 6 (lead capture) will affect the Datenschutz — that branch will own its own update to §6 (Kontaktaufnahme) and add a new §10 covering the form processor. Out of scope here.
- Migrating the site away from GitHub Pages. The hosting choice is disclosed; that is sufficient.
