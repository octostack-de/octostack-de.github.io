# Legal — Impressum & Datenschutzerklärung Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/impressum/` (TMG §5) and `/datenschutz/` (DSGVO art. 13) pages to the Octostack site so it is legally publishable for the German market. Eliminate the only third-party data transfer (Lucide CDN → self-hosted) so the Datenschutz can honestly state "no transfer to third parties beyond hosting".

**Architecture:** Two new German-language Jekyll pages in `_pages/` rendered by a new `_layouts/legal.html` (a long-form reading container chained from `default.html`). Page values are not inlined into the markdown — they read from `_data/legal.yml` via Liquid (`{{ site.data.legal.* }}`), so updates touch one file. Self-host Lucide by pinning a release to `assets/js/lucide.min.js` and switching the layout to a `defer`'d script with a `DOMContentLoaded` init. Footer gains a thin two-link nav above copyright.

**Tech Stack:** Jekyll 3.10 (via `github-pages` gem), Tailwind CSS, Lucide Icons (will be self-hosted by Task 2), self-hosted Inter variable font (already in place).

**Testing note:** this is a static marketing site with no test framework. "Verification" per task = `npm run build` exits 0, plus targeted `grep` commands defined per task and browser visual check. No pytest/jest exists.

**Spec:** `docs/superpowers/specs/2026-04-19-legal-impressum-datenschutz-design.md`

**Branch:** `legal/impressum-datenschutz` (created in Task 1)

**Token resolution:** Markdown bodies use Liquid like `{{ site.data.legal.legal_name }}`. Empty values in `_data/legal.yml` render as empty strings — the build will succeed but pages will look incomplete. Filling `_data/legal.yml` is a separate gating step before merge (Task 9). The plan can be executed end-to-end without the legal data on hand; Task 1 creates the data file with empty placeholders + comments explaining each field.

---

## Task Sequencing Rationale

The data file ships first (Task 1) so every subsequent task that references `site.data.legal.*` resolves cleanly during local builds. Lucide self-hosting (Task 2) is independent of the legal pages and is sequenced early so the rest of the work can verify in a browser without third-party requests. The `.legal-prose` CSS (Task 3) and the `legal` layout (Task 4) are infrastructure for the two content pages (Tasks 5, 6). The footer link row (Task 7) is added after the pages exist so the links are not dead. The `_config.yml` cleanup (Task 8) is unrelated but small enough to ride along. Final verification + PR is Task 9.

Each task ends with a commit so the diff stays bisectable.

---

## Task 1: Create branch and scaffold `_data/legal.yml`

**Goal:** Open the working branch and lay down the single source of truth for legal data. All later tasks read from this file.

**Files:**
- Create: `_data/legal.yml`

- [ ] **Step 1: Create and check out the branch**

Run:
```bash
git checkout main
git pull --ff-only
git checkout -b legal/impressum-datenschutz
git status
```

Expected: clean working tree on `legal/impressum-datenschutz`.

- [ ] **Step 2: Create `_data/legal.yml`**

Create the file with this exact content:

```yaml
# Legal information used to render /impressum/ and /datenschutz/.
# The markdown templates pick up these values at build time via {{ site.data.legal.* }}.
# Empty values render as empty strings — fill ALL required fields before deploy.

# ============================================================
# Impressum (TMG §5)
# ============================================================

# Full legal name as registered.
# - Einzelunternehmer / Freiberufler: personal name (e.g. "Liang Shi")
# - GmbH / UG: registered company name
legal_name: ""

# Street + house number.
street_address: ""

# Postal code + city, e.g. "10115 Berlin".
postal_code_city: ""

# Country.
country: "Deutschland"

# Telephone — REQUIRED under TMG §5(1) Nr. 2. Mobile is fine. No PO box, no "on request".
phone: ""

# Contact email shown on Impressum.
email: "hello@octostack.de"

# Legal form. One of: Einzelunternehmer, Freiberufler, GbR, GmbH, UG.
# Determines which optional blocks render.
business_form: ""

# USt-IdNr. (only if VAT-registered).
# If empty AND business_form is Einzelunternehmer/Freiberufler, the page renders
# the Kleinunternehmer notice (§19 UStG) instead.
vat_id: ""

# Handelsregister entry. Only for GmbH/UG.
# e.g. "HRB 123456 B, Amtsgericht Berlin-Charlottenburg"
hrb_registration: ""

# Geschäftsführer. Only for GmbH/UG.
managing_director: ""

# Verantwortlich nach §18 (2) MStV. Usually same as legal_name + address.
# Format: "Name, Street Number, PLZ City"
responsible_person: ""

# ============================================================
# Datenschutzerklärung (DSGVO art. 13)
# ============================================================

# Email for privacy requests. Often same as `email`. Some controllers prefer datenschutz@.
privacy_email: "hello@octostack.de"

# Hosting provider disclosure. HTML allowed in this string.
hosting_provider: "Diese Website wird gehostet über GitHub Pages, betrieben durch GitHub, Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA. Die Datenübermittlung in die USA erfolgt auf Grundlage der EU-Standardvertragsklauseln (SCC) sowie des EU–US Data Privacy Framework, dem GitHub beigetreten ist."

# Server-log retention statement.
log_retention: "Server-Logfiles werden durch den Hosting-Provider GitHub für maximal 30 Tage zur Sicherstellung des Betriebs gespeichert und danach automatisch gelöscht."

# Supervisory authority (Berlin pre-filled). HTML allowed.
supervisory_authority: "Berliner Beauftragte für Datenschutz und Informationsfreiheit, Alt-Moabit 59-61, 10555 Berlin, <a href=\"https://www.datenschutz-berlin.de\" class=\"text-brand-link hover:underline\">www.datenschutz-berlin.de</a>"

# Manual "last updated" date — update when policy changes. Format: "Month YYYY" in German.
last_updated: "April 2026"
```

- [ ] **Step 3: Verify YAML parses**

Run:
```bash
ruby -ryaml -e "p YAML.load_file('_data/legal.yml').keys"
```

Expected: an array of keys printed including `legal_name`, `street_address`, `phone`, `email`, `business_form`, `vat_id`, `hrb_registration`, `managing_director`, `responsible_person`, `privacy_email`, `hosting_provider`, `log_retention`, `supervisory_authority`, `last_updated`. If a `Psych::SyntaxError` appears, the YAML is malformed — fix and retry.

- [ ] **Step 4: Commit**

```bash
git add _data/legal.yml
git commit -m "feat(legal): scaffold _data/legal.yml with token placeholders

Single source of truth for Impressum and Datenschutz fields.
Values to be filled by the site owner before merge."
```

---

## Task 2: Self-host Lucide

**Goal:** Replace the `unpkg.com` Lucide CDN with a pinned, committed local copy and switch initialisation to `DOMContentLoaded`. Removes the only third-party request the site makes (verified earlier).

**Files:**
- Create: `assets/js/lucide.min.js`
- Modify: `_layouts/default.html` (lines 13-14, 26-29)

- [ ] **Step 1: Pick the Lucide version**

Open https://github.com/lucide-icons/lucide/releases in a browser. Note the most recent stable release tag (e.g. `0.471.0`). Avoid pre-release / RC tags.

- [ ] **Step 2: Download the pinned release**

Run, replacing `<VERSION>` with the version you noted:
```bash
LUCIDE_VERSION="<VERSION>"
mkdir -p assets/js
curl -fL -o assets/js/lucide.min.js \
  "https://unpkg.com/lucide@${LUCIDE_VERSION}/dist/umd/lucide.min.js"
ls -lh assets/js/lucide.min.js
```

Expected: a single file, roughly 30–80 KB. The `-f` flag makes `curl` exit non-zero on HTTP errors. If the file is under 5 KB or `curl` errors, the version path is wrong — verify the URL works in a browser before retrying.

- [ ] **Step 3: Quick sanity check on the file**

Run:
```bash
head -c 200 assets/js/lucide.min.js
```

Expected: minified JavaScript starting with something like `(function(global,factory){…})(this,function(){…})` and **not** an HTML 404 page. If you see `<html>` or `<!DOCTYPE`, the download fetched an error page — delete the file and retry Step 2.

- [ ] **Step 4: Update `_layouts/default.html`**

Replace lines 13-14 (the Lucide CDN script tag) — change:

```html
    <!-- Lucide Icons CDN -->
    <script src="https://unpkg.com/lucide@latest"></script>
```

to:

```html
    <script src="{{ '/assets/js/lucide.min.js' | relative_url }}" defer></script>
```

Replace lines 26-29 (the Lucide init block) — change:

```html
    <script>
        // Initialize Lucide icons
        lucide.createIcons();
    </script>
```

to:

```html
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            lucide.createIcons();
        });
    </script>
```

The `defer` attribute postpones script execution until after HTML parsing, so the inline `createIcons()` would otherwise run before `lucide` is defined. `DOMContentLoaded` waits for both the parser and any defer'd scripts.

- [ ] **Step 5: Build and verify icons still render**

Run:
```bash
npm run build
```

Expected: exit 0, output ends with "Done in N.NNs." and no error lines.

Then start the dev server and open the site:
```bash
npm run dev
```

In a browser open `http://localhost:4000`. Check that all icons render (hero arrow, service cards, contact section icons, footer LinkedIn/GitHub). Open DevTools → Network → filter by "lucide" or "unpkg". On a hard refresh you should see exactly one request to `/assets/js/lucide.min.js` and **zero** requests to `unpkg.com`.

Stop the dev server (Ctrl+C) once verified.

- [ ] **Step 6: Confirm no `unpkg` references remain**

Run:
```bash
grep -rn "unpkg\|cdn\.jsdelivr\|cdnjs" _layouts _includes index.html _config.yml
```

Expected: zero matches. If `_config.yml` still has unrelated `unpkg` references, those are out of scope — but the layout must be clean.

- [ ] **Step 7: Commit**

```bash
git add assets/js/lucide.min.js _layouts/default.html
git commit -m "feat(privacy): self-host Lucide icons, remove unpkg.com CDN

Eliminates the only third-party request the site made. Datenschutz
can now state 'no third-party transfer beyond hosting provider'.

Lucide pinned to <VERSION>; updates are intentional from here on."
```

Replace `<VERSION>` in the commit message with the actual version.

---

## Task 3: Add `.legal-prose` typography component

**Goal:** Give the legal pages readable long-form typography without inlining Tailwind classes into every markdown paragraph. Single CSS block, scoped to `.legal-prose` so it cannot leak into marketing pages.

**Files:**
- Modify: `src/css/input.css`

- [ ] **Step 1: Append the `.legal-prose` block**

Open `src/css/input.css`. After the existing `@layer base { … }` block at the bottom, append:

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

Note the leading blank line — keeps the file readable.

- [ ] **Step 2: Build the CSS and inspect output**

Run:
```bash
npm run build:css
```

Expected: exits 0, writes `assets/css/main.css`.

Confirm the new class is compiled in:
```bash
grep -c "legal-prose" assets/css/main.css
```

Expected: a number greater than 0 (typically 7+, one per scoped selector). If 0, the `@layer components` block was not picked up — re-check the syntax.

- [ ] **Step 3: Commit**

```bash
git add src/css/input.css
git commit -m "feat(legal): add .legal-prose typography component

Scoped long-form prose styling for legal pages — keeps the markdown
clean without a Tailwind prose plugin."
```

---

## Task 4: Create `_layouts/legal.html`

**Goal:** Long-form reading layout: same header/footer, max-w-3xl container, paper-50 background, no hero, no marketing chrome. Renders the `helper_en` front-matter line, the `<h1>` from `page.title`, and the markdown body inside `.legal-prose`.

**Files:**
- Create: `_layouts/legal.html`

- [ ] **Step 1: Create the layout**

Create `_layouts/legal.html` with this exact content:

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

The `layout: default` front matter chains this layout into the existing site shell so header/footer stay consistent.

- [ ] **Step 2: Verify the layout file is valid Liquid**

Run a build (it will succeed even without any page using the layout yet):
```bash
npm run build
```

Expected: exit 0. If Jekyll prints a Liquid syntax error referencing `legal.html`, fix the syntax and retry.

- [ ] **Step 3: Commit**

```bash
git add _layouts/legal.html
git commit -m "feat(legal): add legal layout for long-form pages

Max-w-3xl reading container, paper-50 background, no hero. Chains
into default.html for consistent header/footer."
```

---

## Task 5: Create `_pages/impressum.md`

**Goal:** Render `/impressum/` with all TMG §5 blocks. Optional sections (VAT-ID vs Kleinunternehmer, Handelsregister) render conditionally based on `_data/legal.yml` values.

**Files:**
- Create: `_pages/impressum.md`

- [ ] **Step 1: Create the file**

Create `_pages/impressum.md` with this exact content:

```markdown
---
layout: legal
permalink: /impressum/
title: Impressum
helper_en: "Pursuant to German law (§5 TMG, §18 MStV) the imprint is provided in German."
---

## Angaben gemäß §5 TMG

{{ site.data.legal.legal_name }}<br>
{{ site.data.legal.street_address }}<br>
{{ site.data.legal.postal_code_city }}<br>
{{ site.data.legal.country }}

## Kontakt

Telefon: {{ site.data.legal.phone }}<br>
E-Mail: <a href="mailto:{{ site.data.legal.email }}">{{ site.data.legal.email }}</a>

{% assign vat = site.data.legal.vat_id | strip %}
{% if vat != "" %}
## Umsatzsteuer-ID

Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz: {{ vat }}
{% elsif site.data.legal.business_form == "Einzelunternehmer" or site.data.legal.business_form == "Freiberufler" %}
## Kleinunternehmerregelung

Gemäß §19 UStG wird keine Umsatzsteuer berechnet.
{% endif %}

{% if site.data.legal.business_form == "GmbH" or site.data.legal.business_form == "UG" %}
## Handelsregister

{{ site.data.legal.hrb_registration }}<br>
Geschäftsführer: {{ site.data.legal.managing_director }}
{% endif %}

## Verantwortlich für den Inhalt nach §18 Abs. 2 MStV

{{ site.data.legal.responsible_person }}

## EU-Streitschlichtung

Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr/">https://ec.europa.eu/consumers/odr/</a>. Unsere E-Mail-Adresse finden Sie oben im Impressum.

Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
```

The `<br>` line breaks (instead of trailing-spaces) keep the address blocks rendering as one paragraph. The `assign` + `strip` pattern guards against accidental whitespace in `vat_id`.

- [ ] **Step 2: Build and inspect rendered HTML**

Run:
```bash
npm run build
ls -l _site/impressum/index.html
```

Expected: file exists. Then check the rendered structure:
```bash
grep -E "<h1|<h2|Angaben gemäß|EU-Streitschlichtung" _site/impressum/index.html
```

Expected: at least one `<h1>` line (Impressum), several `<h2>` lines (Angaben gemäß §5 TMG, Kontakt, Verantwortlich…, EU-Streitschlichtung), and the EU-Streitschlichtung paragraph. With the data file empty the address fields will be empty `<br>` chains — that is correct for now.

- [ ] **Step 3: Visual check in browser**

Run `npm run dev`, open `http://localhost:4000/impressum/`. Confirm:
- Header and footer render normally.
- The italic English helper line appears above the H1.
- The H1 reads "Impressum".
- Section headings appear with proper spacing.
- No Liquid syntax error renders to the page.

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add _pages/impressum.md
git commit -m "feat(legal): add /impressum/ page (TMG §5)

German Impressum with conditional VAT/Kleinunternehmer and
Handelsregister blocks driven by _data/legal.yml."
```

---

## Task 6: Create `_pages/datenschutz.md`

**Goal:** Render `/datenschutz/` with all DSGVO art. 13 disclosures. Site is static (no cookies, no analytics, no forms today) so the document is short — that is correct, not a gap.

**Files:**
- Create: `_pages/datenschutz.md`

- [ ] **Step 1: Create the file**

Create `_pages/datenschutz.md` with this exact content:

```markdown
---
layout: legal
permalink: /datenschutz/
title: Datenschutzerklärung
helper_en: "Pursuant to GDPR Art. 13 the privacy notice is provided in German."
---

## 1. Verantwortlicher

Verantwortlich für die Datenverarbeitung auf dieser Website ist:

{{ site.data.legal.legal_name }}<br>
{{ site.data.legal.street_address }}<br>
{{ site.data.legal.postal_code_city }}<br>
{{ site.data.legal.country }}<br>
E-Mail: <a href="mailto:{{ site.data.legal.privacy_email }}">{{ site.data.legal.privacy_email }}</a>

## 2. Erhebung allgemeiner Informationen beim Besuch dieser Website

Diese Website ist rein informativ. Sie setzt keine Cookies, führt keine Webanalyse durch und bindet keine externen Inhalte ein. Bei jedem Aufruf werden durch den Hosting-Provider technische Zugriffsdaten verarbeitet, die für die Auslieferung der Seite notwendig sind: IP-Adresse, User-Agent, Zeitstempel und angeforderte URL. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am stabilen Betrieb der Website). Die Speicherung erfolgt ausschließlich beim Hosting-Provider; siehe Abschnitt 3.

## 3. Hosting

{{ site.data.legal.hosting_provider }}

{{ site.data.legal.log_retention }}

## 4. Schriftarten und Icons

Schriftart (Inter) und Icons (Lucide) werden vollständig vom eigenen Server ausgeliefert. Es erfolgen keine Anfragen an externe CDN-Anbieter wie Google Fonts, unpkg oder jsDelivr.

## 5. Cookies

Diese Website verwendet keine Cookies.

## 6. Kontaktaufnahme per E-Mail

Wenn Sie uns per E-Mail kontaktieren, werden Ihre Angaben zur Bearbeitung der Anfrage und für den Fall von Anschlussfragen gespeichert. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen) bzw. lit. f. Die Daten werden gelöscht, sobald die Anfrage abgeschlossen ist und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.

## 7. Ihre Rechte

Sie haben jederzeit folgende Rechte uns gegenüber:

* Auskunft über die zu Ihrer Person gespeicherten Daten (Art. 15 DSGVO)
* Berichtigung unrichtiger Daten (Art. 16 DSGVO)
* Löschung Ihrer Daten (Art. 17 DSGVO)
* Einschränkung der Verarbeitung (Art. 18 DSGVO)
* Datenübertragbarkeit (Art. 20 DSGVO)
* Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)

Bitte richten Sie Ihre Anfrage an: <a href="mailto:{{ site.data.legal.privacy_email }}">{{ site.data.legal.privacy_email }}</a>.

## 8. Beschwerderecht bei der Aufsichtsbehörde

Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung Ihrer personenbezogenen Daten zu beschweren. Zuständig ist:

{{ site.data.legal.supervisory_authority }}

## 9. Aktualität dieser Datenschutzerklärung

Stand: {{ site.data.legal.last_updated }}. Diese Datenschutzerklärung wird bei Änderungen am Angebot oder an gesetzlichen Vorgaben angepasst.
```

- [ ] **Step 2: Build and inspect rendered HTML**

Run:
```bash
npm run build
ls -l _site/datenschutz/index.html
```

Expected: file exists.

```bash
grep -E "<h1|<h2|Verantwortlicher|Aufsichtsbehörde|Stand:" _site/datenschutz/index.html
```

Expected: H1, nine H2s, the section labels, and the "Stand:" line all present.

- [ ] **Step 3: Visual check in browser**

`npm run dev`, then open `http://localhost:4000/datenschutz/`. Confirm:
- Italic English helper line above H1.
- Numbered section headings render in order.
- Bullet list under §7 displays as a real list (disc bullets, indented).
- "Stand: April 2026" line at the bottom.

Open DevTools → Network on this page. Hard refresh. Confirm zero requests to any third-party host.

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add _pages/datenschutz.md
git commit -m "feat(legal): add /datenschutz/ page (DSGVO art. 13)

Minimal disclosure: static site, no cookies, no analytics, no forms.
Discloses GitHub Pages hosting and Berlin supervisory authority."
```

---

## Task 7: Add legal links to footer

**Goal:** Insert a thin two-link nav (Impressum, Datenschutzerklärung) above the existing copyright line. Rebalance the divider classes so one horizontal rule sits above the legal links and the copyright sits beneath them with normal spacing.

**Files:**
- Modify: `_includes/footer.html` (lines 47-50)

- [ ] **Step 1: Replace the copyright block**

In `_includes/footer.html`, locate lines 47-50 — the existing copyright block:

```html
            <!-- Copyright -->
            <div class="mt-12 pt-8 border-t border-white/10 text-center text-sm">
                <p>&copy; <span id="current-year"></span> {{ site.company.name }}. All rights reserved.</p>
            </div>
```

Replace those four lines with:

```html
            <!-- Legal Links -->
            <nav class="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-center gap-x-6 gap-y-2 text-sm" aria-label="Legal">
                <a href="{{ '/impressum/' | relative_url }}" class="hover:text-white transition-colors">Impressum</a>
                <a href="{{ '/datenschutz/' | relative_url }}" class="hover:text-white transition-colors">Datenschutzerklärung</a>
            </nav>

            <!-- Copyright -->
            <div class="mt-6 text-center text-sm">
                <p>&copy; <span id="current-year"></span> {{ site.company.name }}. All rights reserved.</p>
            </div>
```

The divider line (`border-t border-white/10`) and top spacing (`mt-12 pt-8`) move from the copyright block to the new legal-links nav. The copyright keeps a smaller `mt-6` so it sits closely under the links rather than across another visual gap.

- [ ] **Step 2: Build and check footer markup**

Run:
```bash
npm run build
grep -E "Impressum|Datenschutzerklärung" _site/index.html
```

Expected: at least two matches in the footer of `index.html`. Also check the legal pages themselves include the footer links:

```bash
grep -c "Impressum" _site/impressum/index.html _site/datenschutz/index.html
```

Expected: each file has at least 1 match (the page itself if it's Impressum, plus the footer link on both).

- [ ] **Step 3: Visual check in browser**

`npm run dev`, open `http://localhost:4000`. Scroll to the footer. Confirm:
- Above the copyright line, there is a horizontal rule.
- Below the rule, two links: Impressum and Datenschutzerklärung, side-by-side on desktop, stacked on narrow viewports.
- Below the links, the copyright line.
- Click each link → lands on the respective page; click again from there → returns successfully.

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add _includes/footer.html
git commit -m "feat(legal): link Impressum and Datenschutz from footer

Inserted above the copyright line; the divider rule moves up so
the legal links are part of the same visual group as copyright."
```

---

## Task 8: Remove orphan `social.twitter` from `_config.yml`

**Goal:** The design-md-alignment branch removed the Twitter footer icon but left the URL in `_config.yml`. Nothing references it anymore. Delete the line so future authors do not reintroduce a Twitter link by accident.

**Files:**
- Modify: `_config.yml` (line 15)

- [ ] **Step 1: Confirm `social.twitter` is unreferenced**

Run:
```bash
grep -rn "social.twitter\|company.social.twitter" _includes _layouts index.html assets _pages
```

Expected: zero matches. (If any match appears, stop — removing the key would break a template. Investigate before continuing.)

- [ ] **Step 2: Remove the `twitter:` line from `_config.yml`**

In `_config.yml`, line 15:

```yaml
    twitter: "https://twitter.com/octostack"
```

Delete that single line. The `social:` block now has only `linkedin` and `github`.

- [ ] **Step 3: Build to verify nothing broke**

Run:
```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add _config.yml
git commit -m "chore: drop unused social.twitter from _config.yml

The footer icon was removed in the design-md-alignment branch but
the config key was left behind. No template references it."
```

---

## Task 9: Final verification + open PR

**Goal:** Full-site check, third-party-request audit, and PR creation. This task does not modify code — it only verifies and ships.

- [ ] **Step 1: Full clean build**

Run:
```bash
rm -rf _site
npm run build
echo "exit code: $?"
```

Expected: exit code 0, `_site/` regenerated.

- [ ] **Step 2: Confirm both legal pages built**

```bash
ls -l _site/impressum/index.html _site/datenschutz/index.html
```

Expected: both files exist, both non-empty.

- [ ] **Step 3: Confirm zero third-party requests in built HTML/CSS/JS**

```bash
grep -rEn "unpkg|cdn\.jsdelivr|cdnjs|googleapis|gtag|fbq|google-analytics|googletagmanager" _site
```

Expected: zero matches. Any hit means a third-party request still fires from the deployed site, and the Datenschutz section §4 ("Schriftarten und Icons") would be a lie.

- [ ] **Step 4: Confirm footer links resolve to real pages**

```bash
grep -o 'href="[^"]*impressum[^"]*"' _site/index.html
grep -o 'href="[^"]*datenschutz[^"]*"' _site/index.html
```

Expected: each prints `href="/impressum/"` and `href="/datenschutz/"` (or with the site base URL prefix). If empty, the footer template did not pick up the URLs.

- [ ] **Step 5: Manual browser audit**

`npm run dev`. Visit each of the three pages — `/`, `/impressum/`, `/datenschutz/` — and on each one:

1. Open DevTools → Network panel.
2. Hard refresh (Cmd+Shift+R).
3. Confirm every request's "Domain" column is either `localhost` or empty. Zero `unpkg.com`, zero `fonts.googleapis.com`, zero analytics domains.
4. Footer Impressum + Datenschutzerklärung links work and lead to the right pages.
5. The `helper_en` italic line displays above each legal H1.
6. Lucide icons (header logo if any, footer LinkedIn/GitHub, all body icons) render correctly.

Stop the dev server.

- [ ] **Step 6: Verify `_data/legal.yml` is filled (gating step)**

This is the last gate before merging — the legal pages render empty without it.

```bash
ruby -ryaml -e '
  d = YAML.load_file("_data/legal.yml")
  required = %w[legal_name street_address postal_code_city phone business_form responsible_person]
  empty = required.select { |k| d[k].to_s.strip.empty? }
  if empty.any?
    puts "MISSING REQUIRED VALUES: #{empty.join(", ")}"
    exit 1
  else
    puts "All required Impressum fields present."
  end
'
```

Expected: `All required Impressum fields present.` and exit 0. If any required field is empty, **stop and ask the site owner to fill `_data/legal.yml` before opening the PR.** A missing phone number alone makes the Impressum non-compliant under TMG §5(1) Nr. 2.

(Optional fields skipped by this check: `vat_id`, `hrb_registration`, `managing_director` — those depend on `business_form` and may legitimately be empty.)

- [ ] **Step 7: Push and open PR**

```bash
git push -u origin legal/impressum-datenschutz
gh pr create --title "Add Impressum + Datenschutzerklärung; self-host Lucide" --body "$(cat <<'EOF'
## Summary
- Adds `/impressum/` (TMG §5) and `/datenschutz/` (DSGVO art. 13), German-language as legally canonical
- New `_layouts/legal.html` + `.legal-prose` typography component
- Page values driven by `_data/legal.yml` for single-source maintenance
- Self-hosts Lucide icons (`assets/js/lucide.min.js`), removes the only third-party CDN request the site made
- Footer gains Impressum + Datenschutz links above copyright
- Removes orphan `social.twitter` key from `_config.yml`

Spec: `docs/superpowers/specs/2026-04-19-legal-impressum-datenschutz-design.md`
Plan: `docs/superpowers/plans/2026-04-20-legal-impressum-datenschutz.md`

## Test plan
- [ ] `npm run build` exits 0
- [ ] `/impressum/` and `/datenschutz/` render the German content
- [ ] Footer links to both pages on every page
- [ ] DevTools Network panel shows zero third-party requests on any page
- [ ] Lucide icons render correctly across the site
- [ ] All required fields in `_data/legal.yml` are filled
EOF
)"
```

Expected: PR URL printed. Open it in a browser to confirm.

- [ ] **Step 8: Confirm CI passes and merge when green**

Watch the GitHub Actions workflow for the deploy preview; merge when green. The `.github/workflows/deploy.yml` workflow on `main` will publish to `octostack-de.github.io` automatically.

---

## Verification Summary (success criteria from the spec)

After Task 9 completes:

- ✅ `npm run build` exits 0
- ✅ `_site/impressum/index.html` and `_site/datenschutz/index.html` render German content with all `_data/legal.yml` values substituted
- ✅ Footer on every page shows Impressum + Datenschutzerklärung links
- ✅ `grep -rE 'unpkg|cdn\.jsdelivr|googleapis|gtag|fbq|analytics' _site` returns zero matches
- ✅ Browser DevTools network tab on any page shows only same-origin requests
- ✅ Lucide icons render correctly
- ✅ `social.twitter` is absent from `_config.yml`
- ✅ No empty required fields in `_data/legal.yml`
