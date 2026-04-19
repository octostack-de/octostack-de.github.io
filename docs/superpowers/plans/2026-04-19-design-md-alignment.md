# DESIGN.md Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the Octostack marketing site's visual system in line with `DESIGN.md` — tight typography, monochrome rhythm with three dark anchors, restrained chrome, pill CTAs — while preserving the Octostack ocean-blue brand accent (`#3b7ea1`).

**Architecture:** Styling-only refactor. Tailwind tokens (`primary`/`secondary`/`accent`) are replaced by `ink`/`paper`/`brand`/`darksurf`. Inter variable is self-hosted (DSGVO-safe). Section backgrounds remap to the cinematic rhythm from the spec. `index.html`, `_includes/*.html`, `_layouts/default.html`, `assets/js/main.js`, `tailwind.config.js`, `src/css/input.css` are the only files touched. No content/copy/structure changes.

**Tech Stack:** Jekyll 3.10 (via `github-pages` gem), Tailwind CSS (standalone CLI), Lucide Icons via CDN, self-hosted Inter variable font.

**Testing note:** this is a static marketing site with no test framework. "Verification" per task = `npm run build` exits 0, plus targeted `grep` commands (defined per task) and browser visual check against `DESIGN.md`. No pytest/jest exists.

**Spec:** `docs/superpowers/specs/2026-04-19-design-md-alignment-design.md`

**Branch:** `style/design-md-alignment` (already checked out)

---

## Task Sequencing Rationale

Tokens must exist before components can reference them; components must exist before sections use them. So:

1. Font asset + global CSS (Task 1)
2. Tailwind tokens (Task 2)
3. Layout preload (Task 3)
4. Shared includes — header, footer, service-card (Tasks 4–6)
5. JS token swap (Task 7)
6. `index.html` section-by-section following the rhythm map (Tasks 8–15)
7. Final full-build verification + PR prep (Task 16)

Each task ends with a commit. This keeps the diff reviewable and lets us bisect if a later task visually regresses an earlier one.

---

## Task 1: Self-host Inter variable font + global CSS

**Goal:** Get the Inter variable font file on disk, wire it up via `@font-face`, add the global tight-tracking rule, and remove the old `.text-gradient` utility.

**Files:**
- Create: `assets/fonts/InterVariable.woff2`
- Modify: `src/css/input.css` (entire file)

- [ ] **Step 1: Download Inter variable woff2**

Run:
```bash
mkdir -p assets/fonts
curl -L -o assets/fonts/InterVariable.woff2 \
  https://rsms.me/inter/font-files/InterVariable.woff2
ls -lh assets/fonts/InterVariable.woff2
```

Expected: a single file, roughly 300–360KB. If the download fails or is under 100KB, stop and report — do not commit a broken asset.

- [ ] **Step 2: Rewrite `src/css/input.css`**

Replace the full contents of `src/css/input.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('/assets/fonts/InterVariable.woff2') format('woff2-variations');
}

@layer base {
  body {
    letter-spacing: -0.01em;
  }
}
```

Note: the `.text-gradient` utility is removed. No Tailwind `@apply` directives remain in this file.

- [ ] **Step 3: Verify the build still compiles**

Run:
```bash
npm run build:css
```

Expected: exits 0. `assets/css/main.css` regenerated.

- [ ] **Step 4: Verify `.text-gradient` no longer exists in the compiled CSS**

Run:
```bash
grep -c 'text-gradient' assets/css/main.css || echo "0 matches"
```

Expected: `0 matches` (since the utility is gone and no HTML references it yet).

- [ ] **Step 5: Commit**

```bash
git add assets/fonts/InterVariable.woff2 src/css/input.css
git commit -m "style: self-host Inter font, add tight-tracking rule, drop text-gradient utility"
```

---

## Task 2: Rewrite Tailwind token config

**Goal:** Replace the `primary`/`secondary`/`accent` color scales with `ink`/`paper`/`brand`/`darksurf`; wire Inter into `fontFamily.sans`; add the `shadow-card` extension.

**Files:**
- Modify: `tailwind.config.js` (entire file)

- [ ] **Step 1: Replace `tailwind.config.js` with the new token set**

Overwrite the file with:

```js
module.exports = {
  content: [
    './_includes/**/*.html',
    './_layouts/**/*.html',
    './_posts/*.md',
    './*.html',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#000000',
          800: '#1d1d1f',
          700: 'rgba(0, 0, 0, 0.8)',
          600: 'rgba(0, 0, 0, 0.48)',
        },
        paper: {
          50:  '#ffffff',
          100: '#f5f5f7',
          200: '#ededf2',
        },
        darksurf: {
          1: '#272729',
          2: '#262628',
          3: '#28282a',
        },
        brand: {
          500: '#3b7ea1',
          600: '#2e6580',
          700: '#244d61',
          link: '#2e6580',
          darklink: '#4aa9c8',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 5px 30px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: Rebuild CSS and confirm no config errors**

Run:
```bash
npm run build:css
```

Expected: exits 0. If Tailwind errors about unknown classes in the content files, that's fine at this stage — we'll be rewriting those HTML files next. A syntax error in `tailwind.config.js` itself would block the build; investigate and fix.

- [ ] **Step 3: Verify the deleted scales are not referenced in the compiled CSS payload from the config itself**

The HTML still references `primary-*`/`secondary-*`/`accent-*` classes at this point — they will simply not compile into `main.css` because those tokens no longer exist. The next tasks remove the references from HTML. Proceed.

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.js
git commit -m "style: replace primary/secondary/accent scales with ink/paper/brand/darksurf tokens"
```

---

## Task 3: Add font preload hint in default layout

**Goal:** Preload Inter so first paint picks it up without FOIT.

**Files:**
- Modify: `_layouts/default.html`

- [ ] **Step 1: Add the preload tag**

In `_layouts/default.html`, find this line (currently line 10):

```html
    <link rel="stylesheet" href="{{ '/assets/css/main.css' | relative_url }}">
```

Insert a preload tag immediately BEFORE it so the result is:

```html
    <link rel="preload" as="font" type="font/woff2" href="{{ '/assets/fonts/InterVariable.woff2' | relative_url }}" crossorigin>
    <link rel="stylesheet" href="{{ '/assets/css/main.css' | relative_url }}">
```

- [ ] **Step 2: Commit**

```bash
git add _layouts/default.html
git commit -m "style: preload Inter variable font"
```

---

## Task 4: Rewrite header to light glass nav

**Goal:** Replace the current `bg-white/95 backdrop-blur-sm shadow-sm` header with the spec's light-glass nav. Remap all `secondary-*`/`primary-*` classes to `ink-*`/`brand-*`. Height unchanged.

**Files:**
- Modify: `_includes/header.html` (entire file)

- [ ] **Step 1: Replace `_includes/header.html`**

Overwrite with:

```html
<header class="sticky top-0 z-50 bg-white/80 backdrop-blur-[20px] backdrop-saturate-[180%] border-b border-black/5">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20 md:h-24">
            <!-- Logo -->
            <a href="/" class="flex items-center space-x-3">
                <img src="{{ '/assets/images/octostack-white.png' | relative_url }}" alt="Octostack Logo" class="h-12 md:h-16 w-auto">
            </a>

            <!-- Desktop Navigation -->
            <nav class="hidden md:flex items-center space-x-8">
                <a href="#home" class="nav-link text-sm font-normal transition-colors cursor-pointer text-ink-700 hover:text-ink-800">
                    Home
                </a>
                <a href="#services" class="nav-link text-sm font-normal transition-colors cursor-pointer text-ink-700 hover:text-ink-800">
                    Services
                </a>
                <a href="#about" class="nav-link text-sm font-normal transition-colors cursor-pointer text-ink-700 hover:text-ink-800">
                    About
                </a>
                <a href="#contact" class="nav-link text-sm font-normal transition-colors cursor-pointer text-ink-700 hover:text-ink-800">
                    Contact
                </a>
            </nav>

            <!-- Mobile Menu Button -->
            <button id="mobile-menu-btn" class="md:hidden p-2 text-ink-700 hover:text-ink-800" aria-label="Toggle menu">
                <i data-lucide="menu" class="w-6 h-6"></i>
            </button>
        </div>

        <!-- Mobile Navigation -->
        <nav id="mobile-menu" class="hidden md:hidden py-4 border-t border-black/5">
            <a href="#home" class="nav-link block py-3 text-base font-normal transition-colors cursor-pointer text-ink-700 hover:text-ink-800">
                Home
            </a>
            <a href="#services" class="nav-link block py-3 text-base font-normal transition-colors cursor-pointer text-ink-700 hover:text-ink-800">
                Services
            </a>
            <a href="#about" class="nav-link block py-3 text-base font-normal transition-colors cursor-pointer text-ink-700 hover:text-ink-800">
                About
            </a>
            <a href="#contact" class="nav-link block py-3 text-base font-normal transition-colors cursor-pointer text-ink-700 hover:text-ink-800">
                Contact
            </a>
        </nav>
    </div>
</header>
```

- [ ] **Step 2: Verify no old tokens remain in the file**

Run:
```bash
grep -E 'primary-|secondary-|accent-' _includes/header.html || echo "clean"
```

Expected: `clean`.

- [ ] **Step 3: Commit**

```bash
git add _includes/header.html
git commit -m "style: rewrite header to light glass nav per DESIGN.md"
```

---

## Task 5: Rewrite footer (dark anchor + Twitter removal)

**Goal:** Footer becomes the natural third dark anchor. Twitter icon and its `<a>` are removed per the spec. All color tokens remapped.

**Files:**
- Modify: `_includes/footer.html` (entire file)

- [ ] **Step 1: Replace `_includes/footer.html`**

Overwrite with:

```html
<footer class="bg-ink-800 text-white/70">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-12 md:py-16">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                <!-- Company Info -->
                <div>
                    <div class="mb-4">
                        <img src="{{ '/assets/images/octostack-white.png' | relative_url }}" alt="Octostack Logo" class="h-12 w-auto">
                    </div>
                    <p class="text-sm mb-4">{{ site.company.tagline }}</p>
                    <div class="flex space-x-4">
                        <a href="{{ site.company.social.linkedin }}" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors" aria-label="LinkedIn">
                            <i data-lucide="linkedin" class="w-5 h-5"></i>
                        </a>
                        <a href="{{ site.company.social.github }}" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors" aria-label="GitHub">
                            <i data-lucide="github" class="w-5 h-5"></i>
                        </a>
                    </div>
                </div>

                <!-- Quick Links -->
                <div>
                    <h3 class="font-semibold text-white mb-4">Quick Links</h3>
                    <ul class="space-y-2">
                        <li><a href="#home" class="text-sm hover:text-white transition-colors">Home</a></li>
                        <li><a href="#services" class="text-sm hover:text-white transition-colors">Services</a></li>
                        <li><a href="#about" class="text-sm hover:text-white transition-colors">About</a></li>
                        <li><a href="#contact" class="text-sm hover:text-white transition-colors">Contact</a></li>
                    </ul>
                </div>

                <!-- Contact Info -->
                <div>
                    <h3 class="font-semibold text-white mb-4">Contact</h3>
                    <ul class="space-y-2 text-sm">
                        <li>
                            <a href="mailto:{{ site.company.email }}" class="flex items-center space-x-2 hover:text-white transition-colors">
                                <i data-lucide="mail" class="w-4 h-4"></i>
                                <span>{{ site.company.email }}</span>
                            </a>
                        </li>
                        <li>{{ site.company.address }}</li>
                    </ul>
                </div>
            </div>

            <!-- Copyright -->
            <div class="mt-12 pt-8 border-t border-white/10 text-center text-sm">
                <p>&copy; <span id="current-year"></span> {{ site.company.name }}. All rights reserved.</p>
            </div>
        </div>
    </div>
</footer>

<script>
    document.getElementById('current-year').textContent = new Date().getFullYear();
</script>
```

- [ ] **Step 2: Verify cleanup**

Run:
```bash
grep -E 'primary-|secondary-|accent-|twitter' _includes/footer.html || echo "clean"
```

Expected: `clean`.

- [ ] **Step 3: Commit**

```bash
git add _includes/footer.html
git commit -m "style: dark-anchor footer, remove Twitter link, remap tokens"
```

---

## Task 6: Rewrite service-card include

**Goal:** Static card (no hover lift, no hover glow). Light section variant by default. Uses new icon chip, card shadow, and brand tokens.

**Files:**
- Modify: `_includes/service-card.html` (entire file)

- [ ] **Step 1: Replace `_includes/service-card.html`**

Overwrite with:

```html
<div class="bg-paper-100 rounded-md p-8 shadow-card">
    <div class="flex items-start space-x-4">
        <div class="flex-shrink-0">
            <div class="w-12 h-12 rounded-md bg-brand-500/10 flex items-center justify-center">
                <i data-lucide="{{ include.service.icon }}" class="w-6 h-6 text-brand-500"></i>
            </div>
        </div>
        <div class="flex-1">
            <h3 class="text-xl font-semibold leading-[1.19] mb-2 text-ink-800">{{ include.service.title }}</h3>
            <p class="text-ink-700 mb-4">{{ include.service.description }}</p>
            <ul class="space-y-1.5">
                {% for feature in include.service.features %}
                <li class="flex items-start">
                    <i data-lucide="check-circle" class="w-4 h-4 text-brand-500 mr-2 flex-shrink-0 mt-0.5"></i>
                    <span class="text-sm text-ink-700">{{ feature }}</span>
                </li>
                {% endfor %}
            </ul>
        </div>
    </div>
</div>
```

Note on card background strategy: the default here is `bg-paper-100`. Sections with `bg-paper-100` themselves need contrast — those are handled in the section tasks by wrapping the include in an extra container that overrides the card bg, OR by inlining the card markup in those sections. The spec (§Service card on light-gray section) says "swap card bg `bg-paper-100` → `bg-white`". In practice this means: in Task 10 (Development & Ops, `bg-paper-100`) and Task 12 (Architecture advisory, `bg-ink-900`) we inline a per-section card variant rather than using this include. The include stays as the "default light / white-section" variant used by Tasks 9 and 11.

- [ ] **Step 2: Verify cleanup**

Run:
```bash
grep -E 'primary-|secondary-|accent-|hover:-translate|shadow-xl' _includes/service-card.html || echo "clean"
```

Expected: `clean`.

- [ ] **Step 3: Commit**

```bash
git add _includes/service-card.html
git commit -m "style: static service-card on paper-100 with brand-tinted icon chip"
```

---

## Task 7: Swap nav-link active classes in main.js

**Goal:** Replace the deleted `text-primary-600`/`text-secondary-600` tokens in the active-section highlighting logic with `text-ink-800` (active) / `text-ink-700` (default).

**Files:**
- Modify: `assets/js/main.js` (lines 46–50)

- [ ] **Step 1: Edit main.js**

In `assets/js/main.js`, locate the `updateActiveSection` function body (currently lines 40–55). Replace the four lines that reference the old tokens so the block becomes:

```js
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                const { offsetTop, offsetHeight } = section;
                if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                    navLinks.forEach(link => {
                        link.classList.remove('text-ink-800');
                        link.classList.add('text-ink-700');
                        if (link.getAttribute('href') === `#${sectionId}`) {
                            link.classList.remove('text-ink-700');
                            link.classList.add('text-ink-800');
                        }
                    });
                }
            }
        });
```

- [ ] **Step 2: Verify cleanup**

Run:
```bash
grep -E 'primary-|secondary-|accent-' assets/js/main.js || echo "clean"
```

Expected: `clean`.

- [ ] **Step 3: Commit**

```bash
git add assets/js/main.js
git commit -m "style: active-nav class swap uses ink tokens"
```

---

## Task 8: Rewrite hero section (dark anchor)

**Goal:** Hero becomes `bg-ink-900`. Remove pastel gradient + two blur blobs + gradient-text headline + decorative icon pill. CTAs become new pill components. Headline solid white.

**Files:**
- Modify: `index.html` (lines 5–43 — the `<section id="home">` block)

- [ ] **Step 1: Replace the hero `<section>` block**

In `index.html`, find and replace lines 5–43 (the hero block beginning with `<!-- Hero Section -->` through its closing `</section>`) with:

```html
<!-- Hero Section -->
<section id="home" class="bg-ink-900 py-20 md:py-32">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="max-w-4xl mx-auto text-center">
            <!-- Heading -->
            <h1 class="text-5xl md:text-6xl font-semibold leading-[1.07] tracking-[-0.02em] text-white mb-6">
                Specialized in Digital Identity &amp; Healthcare Infrastructure
            </h1>

            <!-- Subheading -->
            <p class="text-lg md:text-xl leading-[1.5] text-white/80 mb-10 max-w-2xl mx-auto">
                Expert infrastructure, SRE, and software development for digital identity systems, EUDI Wallet implementations, and gematik-compliant digital health solutions.
            </p>

            <!-- CTAs -->
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="#contact" class="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-normal rounded-full text-white bg-brand-500 hover:bg-brand-600 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:outline-none">
                    Get Started
                    <i data-lucide="arrow-right" class="w-5 h-5"></i>
                </a>
                <a href="#services" class="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-normal rounded-full text-brand-darklink border border-brand-darklink hover:bg-brand-darklink hover:text-ink-900 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:outline-none">
                    Our Services
                </a>
            </div>
        </div>
    </div>
</section>
```

Notes:
- The outline pill on the dark hero uses `brand-darklink` (`#4aa9c8`) instead of `brand-500` so it has enough luminance against black. Hover flips to filled light-cyan with dark text.
- The "Icon" block (lines 15–18 in the original) is removed per spec §Hero icon pill (removed).
- The two `.blur-3xl` decoration divs (original lines 8–11) are removed.
- Copy is preserved verbatim from the original; only the `<span class="text-gradient">…</span>` wrapper is removed so "Digital Identity & Healthcare" is no longer visually distinguished inside the headline.

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "style: rewrite hero as dark-anchor with pill CTAs and no decoration"
```

---

## Task 9: Rewrite services-overview section (light-gray)

**Goal:** Section becomes `bg-paper-100`. Kill `text-gradient` on heading. Inline overview cards get the new static treatment with white background for contrast on the gray section.

**Files:**
- Modify: `index.html` (lines 45–69 — the `<section id="services">` block)

- [ ] **Step 1: Replace the services-overview `<section>` block**

Find and replace lines 45–69 with:

```html
<!-- Services Overview -->
<section id="services" class="py-16 md:py-24 bg-paper-100">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
            <h2 class="text-4xl md:text-5xl font-semibold leading-[1.1] text-ink-800 mb-4">
                Our Specialized Services
            </h2>
            <p class="text-lg leading-[1.5] text-ink-700 max-w-2xl mx-auto">
                End-to-end solutions for digital identity, EUDI Wallet, and digital health infrastructure
            </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            {% for service in site.data.services.cloud limit:3 %}
            <div class="bg-white rounded-md p-8 shadow-card text-center">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-md bg-brand-500/10 mb-4">
                    <i data-lucide="{{ service.icon }}" class="w-8 h-8 text-brand-500"></i>
                </div>
                <h3 class="text-xl font-semibold leading-[1.19] text-ink-800 mb-3">{{ service.title }}</h3>
                <p class="text-ink-700">{{ service.description }}</p>
            </div>
            {% endfor %}
        </div>
    </div>
</section>
```

Cards here use `bg-white` because the section is `bg-paper-100` (contrast flip per spec §Service card on light-gray section).

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "style: services overview on paper-100 with white cards"
```

---

## Task 10: Rewrite specialized-infrastructure detail section (white)

**Goal:** Section stays white (`bg-paper-50`). Cards use the default `service-card.html` include on `bg-paper-100`. Heading remapped to new tokens.

**Files:**
- Modify: `index.html` (lines 71–86 — the "Detailed Services - Specialized" block)

- [ ] **Step 1: Replace the specialized-infrastructure `<section>` block**

Find and replace lines 71–86 with:

```html
<!-- Detailed Services - Specialized -->
<section class="py-16 md:py-24 bg-paper-50">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-12">
            <h2 class="text-3xl font-semibold leading-[1.1] text-ink-800 mb-4">Specialized Infrastructure Services</h2>
            <p class="text-lg leading-[1.5] text-ink-700">
                Expert infrastructure, architecture, and development for digital identity, EUDI Wallet, and digital health systems with focus on security and compliance.
            </p>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {% for service in site.data.services.cloud %}
            {% include service-card.html service=service %}
            {% endfor %}
        </div>
    </div>
</section>
```

The include renders cards on `bg-paper-100` which reads cleanly against the `bg-paper-50` section.

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "style: specialized infrastructure section on paper-50"
```

---

## Task 11: Rewrite development-ops detail section (light-gray with white cards)

**Goal:** Section stays `bg-paper-100`. Because this section's background matches the default card bg, we inline a white-card variant rather than using the include.

**Files:**
- Modify: `index.html` (lines 88–103 — the "Detailed Services - Development" block)

- [ ] **Step 1: Replace the development-ops `<section>` block**

Find and replace lines 88–103 with:

```html
<!-- Detailed Services - Development -->
<section class="py-16 md:py-24 bg-paper-100">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-12">
            <h2 class="text-3xl font-semibold leading-[1.1] text-ink-800 mb-4">Development &amp; Operations</h2>
            <p class="text-lg leading-[1.5] text-ink-700">
                Modern DevOps, SRE practices, and custom software development to deliver secure, scalable, and compliant solutions.
            </p>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {% for service in site.data.services.transformation %}
            <div class="bg-white rounded-md p-8 shadow-card">
                <div class="flex items-start space-x-4">
                    <div class="flex-shrink-0">
                        <div class="w-12 h-12 rounded-md bg-brand-500/10 flex items-center justify-center">
                            <i data-lucide="{{ service.icon }}" class="w-6 h-6 text-brand-500"></i>
                        </div>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-xl font-semibold leading-[1.19] mb-2 text-ink-800">{{ service.title }}</h3>
                        <p class="text-ink-700 mb-4">{{ service.description }}</p>
                        <ul class="space-y-1.5">
                            {% for feature in service.features %}
                            <li class="flex items-start">
                                <i data-lucide="check-circle" class="w-4 h-4 text-brand-500 mr-2 flex-shrink-0 mt-0.5"></i>
                                <span class="text-sm text-ink-700">{{ feature }}</span>
                            </li>
                            {% endfor %}
                        </ul>
                    </div>
                </div>
            </div>
            {% endfor %}
        </div>
    </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "style: development & ops on paper-100 with white card variant"
```

---

## Task 12: Rewrite architecture-advisory detail section (dark anchor)

**Goal:** This is the mid-page dark moment. Section `bg-ink-900`. Cards on `bg-darksurf-1`, no shadow, white text, `brand-darklink` accents.

**Files:**
- Modify: `index.html` (lines 105–120 — the "Detailed Services - Consulting" block)

- [ ] **Step 1: Replace the architecture-advisory `<section>` block**

Find and replace lines 105–120 with:

```html
<!-- Detailed Services - Consulting -->
<section class="py-16 md:py-24 bg-ink-900">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-12">
            <h2 class="text-3xl font-semibold leading-[1.1] text-white mb-4">Architecture &amp; Advisory</h2>
            <p class="text-lg leading-[1.5] text-white/80">
                Strategic technical guidance for infrastructure modernization, technology selection, and compliance requirements.
            </p>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {% for service in site.data.services.consulting %}
            <div class="bg-darksurf-1 rounded-md p-8">
                <div class="flex items-start space-x-4">
                    <div class="flex-shrink-0">
                        <div class="w-12 h-12 rounded-md bg-brand-darklink/10 flex items-center justify-center">
                            <i data-lucide="{{ service.icon }}" class="w-6 h-6 text-brand-darklink"></i>
                        </div>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-xl font-semibold leading-[1.19] mb-2 text-white">{{ service.title }}</h3>
                        <p class="text-white/80 mb-4">{{ service.description }}</p>
                        <ul class="space-y-1.5">
                            {% for feature in service.features %}
                            <li class="flex items-start">
                                <i data-lucide="check-circle" class="w-4 h-4 text-brand-darklink mr-2 flex-shrink-0 mt-0.5"></i>
                                <span class="text-sm text-white/80">{{ feature }}</span>
                            </li>
                            {% endfor %}
                        </ul>
                    </div>
                </div>
            </div>
            {% endfor %}
        </div>
    </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "style: architecture advisory as mid-page dark anchor"
```

---

## Task 13: Rewrite about section (white)

**Goal:** Section becomes `bg-paper-50`. Remove pastel gradient bg. Kill `text-gradient` on heading. Remap typography classes.

**Files:**
- Modify: `index.html` (lines 122–134 — the `<section id="about">` block)

- [ ] **Step 1: Replace the about `<section>` block**

Find and replace lines 122–134 with:

```html
<!-- About Section -->
<section id="about" class="py-16 md:py-24 bg-paper-50">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="max-w-3xl mx-auto text-center mb-12">
            <h2 class="text-4xl md:text-5xl font-semibold leading-[1.1] text-ink-800 mb-6">
                About Octostack
            </h2>
            <p class="text-lg md:text-xl leading-[1.5] text-ink-700">
                We are a team of cloud experts passionate about helping businesses succeed in the digital age through cutting-edge technology and proven best practices.
            </p>
        </div>
    </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "style: about section on paper-50, drop pastel gradient and text-gradient"
```

---

## Task 14: Rewrite values section (light-gray)

**Goal:** Section becomes `bg-paper-100`. Value cards use the same static, white-bg-on-gray variant as the dev-ops cards.

**Files:**
- Modify: `index.html` (lines 136–158 — the "Company Values" block)

- [ ] **Step 1: Replace the values `<section>` block**

Find and replace lines 136–158 with:

```html
<!-- Company Values -->
<section class="py-16 md:py-24 bg-paper-100">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-semibold leading-[1.1] text-ink-800 mb-8">Our Values</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {% for value in site.data.values %}
            <div class="bg-white rounded-md p-8 shadow-card">
                <div class="flex items-start space-x-4">
                    <div class="flex-shrink-0">
                        <div class="w-12 h-12 rounded-md bg-brand-500/10 flex items-center justify-center">
                            <i data-lucide="{{ value.icon }}" class="w-6 h-6 text-brand-500"></i>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-xl font-semibold leading-[1.19] text-ink-800 mb-2">{{ value.title }}</h3>
                        <p class="text-ink-700">{{ value.description }}</p>
                    </div>
                </div>
            </div>
            {% endfor %}
        </div>
    </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "style: values section on paper-100 with white card variant"
```

---

## Task 15: Rewrite contact section (white)

**Goal:** Section stays `bg-paper-50`. Kill `text-gradient` on heading. Cards switch to `bg-paper-100` with no border. Icon chips lose pastel `bg-primary-100` and gain `bg-brand-500/10`. Contact section structure (two cards: contact details + social) is preserved.

**Files:**
- Modify: `index.html` (lines 160–224 — the `<section id="contact">` block)

- [ ] **Step 1: Replace the contact `<section>` block**

Find and replace lines 160–224 with:

```html
<!-- Contact Section -->
<section id="contact" class="py-16 md:py-24 bg-paper-50">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="max-w-3xl mx-auto text-center mb-12">
            <h2 class="text-4xl md:text-5xl font-semibold leading-[1.1] text-ink-800 mb-6">
                Get in Touch
            </h2>
            <p class="text-lg md:text-xl leading-[1.5] text-ink-700">
                Ready to transform your cloud infrastructure? Let's discuss how we can help you achieve your goals.
            </p>
        </div>

        <div class="max-w-3xl mx-auto mt-12">
            <h3 class="text-2xl font-semibold leading-[1.19] text-ink-800 mb-6">Contact Details</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Contact Details Card -->
                <div class="bg-paper-100 rounded-md p-8 shadow-card">
                    <h3 class="text-xl font-semibold leading-[1.19] text-ink-800 mb-4">Contact Details</h3>
                    <div class="space-y-4">
                        <div class="flex items-start space-x-3">
                            <i data-lucide="user" class="w-5 h-5 text-brand-500 mt-1 flex-shrink-0"></i>
                            <div>
                                <p class="font-semibold text-ink-800">Name</p>
                                <p class="text-ink-700">Liang Shi</p>
                            </div>
                        </div>
                        <div class="flex items-start space-x-3">
                            <i data-lucide="mail" class="w-5 h-5 text-brand-500 mt-1 flex-shrink-0"></i>
                            <div>
                                <p class="font-semibold text-ink-800">Email</p>
                                <a href="mailto:{{ site.company.email }}" class="text-brand-link hover:underline transition-colors">
                                    {{ site.company.email }}
                                </a>
                            </div>
                        </div>
                        <div class="flex items-start space-x-3">
                            <i data-lucide="map-pin" class="w-5 h-5 text-brand-500 mt-1 flex-shrink-0"></i>
                            <div>
                                <p class="font-semibold text-ink-800">Location</p>
                                <p class="text-ink-700">{{ site.company.address }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Social Media Card -->
                <div class="bg-paper-100 rounded-md p-8 shadow-card">
                    <h3 class="text-xl font-semibold leading-[1.19] text-ink-800 mb-4">Follow Us</h3>
                    <div class="flex space-x-4">
                        <a href="{{ site.company.social.linkedin }}" target="_blank" rel="noopener noreferrer"
                           class="w-10 h-10 rounded-md bg-brand-500/10 flex items-center justify-center text-brand-500 hover:bg-brand-500 hover:text-white transition-colors"
                           aria-label="LinkedIn">
                            <i data-lucide="linkedin" class="w-5 h-5"></i>
                        </a>
                        <a href="{{ site.company.social.github }}" target="_blank" rel="noopener noreferrer"
                           class="w-10 h-10 rounded-md bg-brand-500/10 flex items-center justify-center text-brand-500 hover:bg-brand-500 hover:text-white transition-colors"
                           aria-label="GitHub">
                            <i data-lucide="github" class="w-5 h-5"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
```

Structural content (duplicate "Contact Details" H3, social card, etc.) is deliberately preserved — spec §Explicit Non-Goals lists section restructuring as out of scope.

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "style: contact section on paper-50 with paper-100 cards and brand-tinted chips"
```

---

## Task 16: Final verification, build, visual check, PR prep

**Goal:** Prove the spec's success criteria hold. Build passes. No old tokens remain anywhere. Visual check in browser passes. Then push and open PR.

**Files:** none modified — verification only.

- [ ] **Step 1: Run the spec's grep checks**

Run the following commands (from the spec §Success Criteria). All must return empty output OR exit non-zero (meaning no matches):

```bash
grep -r 'text-gradient' index.html _includes _layouts src/css || echo "text-gradient: clean"
grep -r 'bg-gradient-to' index.html _includes _layouts src/css || echo "bg-gradient-to: clean"
grep -r 'blur-3xl' index.html _includes _layouts src/css || echo "blur-3xl: clean"
grep -rE 'accent-|primary-|secondary-' index.html _includes _layouts src/css assets/js || echo "old token classes: clean"
grep -rE 'shadow-lg|hover:-translate-y' index.html _includes _layouts src/css || echo "decorative shadow/hover-lift: clean"
grep -E '"accent"|\baccent:' tailwind.config.js || echo "accent key absent from tailwind config: clean"
```

Expected: each one prints its `clean` message (or empty). If any returns matches, stop — fix the stray reference in-place and re-run.

- [ ] **Step 2: Run full production build**

```bash
npm run build
```

Expected: exits 0. `_site/assets/css/main.css` exists and contains the compiled Tailwind output. If it fails, read the error, fix, and re-run.

- [ ] **Step 3: Start dev server and visually verify**

```bash
npm run dev
```

Open http://localhost:4000 in a browser.

Visual checklist (walk through once at desktop width, once at ≤640px):
- **Hero:** solid black background, white headline in Inter semibold with tight tracking, no blur blobs, no icon pill, no pastel gradient. Primary CTA is a blue pill; outline CTA is a cyan outline pill.
- **Nav:** white translucent on the dark hero — should read as frosted glass, not opaque. Scroll through sections; active link darkens (ink-800) rather than turning blue.
- **Services overview:** light gray section, three white cards with soft shadow, heading is plain ink (no gradient).
- **Specialized infrastructure:** white section, cards on `paper-100` (slightly gray cards on white).
- **Development & ops:** light gray section, white cards.
- **Architecture advisory:** solid black mid-page block. Cards are dark-surf gray. Icons/checks/links are cyan (`brand-darklink`). Text is white.
- **About:** white section, plain ink heading.
- **Values:** light gray section with white cards.
- **Contact:** white section, `paper-100` cards, brand-tinted icon chips, email link is ocean-blue and underlines on hover.
- **Footer:** near-black (`ink-800`). Only LinkedIn and GitHub icons — no Twitter.
- **Focus rings:** tab through CTAs; each primary/outline pill should show a blue 2px ring.

If anything visually regresses, identify which Task owns that section, fix in-place, commit with a `style: fix <section>` message, and re-run verification.

- [ ] **Step 4: Push branch and open PR**

```bash
git push -u origin style/design-md-alignment
gh pr create --title "style: align visual system with DESIGN.md" --body "$(cat <<'EOF'
## Summary
- Adopts DESIGN.md discipline (typography, tight tracking, pill CTAs, cinematic dark/light rhythm) while keeping Octostack ocean blue as the single accent.
- Self-hosts Inter variable font (DSGVO-safe).
- Replaces Tailwind `primary`/`secondary`/`accent` scales with `ink`/`paper`/`brand`/`darksurf` tokens.
- Three dark anchors: hero, architecture advisory, footer. The rest is a white ↔ light-gray rhythm.
- Removes Twitter link from footer (no active presence; empty link hurts trust).

No copy, structural, or content changes. Spec: `docs/superpowers/specs/2026-04-19-design-md-alignment-design.md`.

## Test plan
- [ ] `npm run build` exits 0
- [ ] All grep checks from spec §Success Criteria return no matches
- [ ] Visual verification: hero is black, one mid-section is black, footer is dark; rest is white/light-gray; only `brand-500` / `brand-darklink` blue appears as chromatic accent
- [ ] Focus rings visible on CTAs
- [ ] Mobile breakpoint still usable (≤640px)
- [ ] Deploy workflow green after merge
EOF
)"
```

Return the PR URL in the final reply.

---

## Self-Review Checklist

Run mentally before handing off to execution:

1. **Spec coverage**
   - Design tokens (Task 2) ✓
   - Inter typography + tight tracking (Tasks 1, 2, 3) ✓
   - Primary CTA, outline CTA, learn-more link styles (Task 8 hero CTAs cover primary + outline; learn-more link not currently used in any section — the spec introduces the style but no section references it, so we omit rather than invent a placeholder) ✓
   - Service card light variant (Task 6 include, used by Task 10) ✓
   - Service card light-gray variant (Tasks 9, 11, 14 inline the `bg-white` flip) ✓
   - Service card dark variant (Task 12 inlines the `bg-darksurf-1` variant) ✓
   - Nav light glass (Task 4) ✓
   - Footer dark anchor + Twitter removal (Task 5) ✓
   - Hero icon pill removed (Task 8) ✓
   - Section rhythm map rows 1–8 + footer (Tasks 8, 9, 10, 11, 12, 13, 14, 15, 5) ✓
   - `main.js` token swap (Task 7) ✓
   - Success criteria grep checks (Task 16) ✓

2. **No placeholders**
   - Every code block is concrete and complete. No "TBD" / "similar to Task N" / "add appropriate error handling". ✓

3. **Type consistency**
   - `ink-800` / `ink-700` used consistently for text on light. ✓
   - `brand-500` everywhere on light, `brand-darklink` everywhere on dark. ✓
   - `rounded-md` for cards and icon chips, `rounded-full` for CTA pills — matches spec exactly (Tailwind defaults, no custom `rounded-pill`/`rounded-sm`). ✓
   - `shadow-card` is the only card shadow token referenced; defined in Task 2 `tailwind.config.js`. ✓
   - Font stack: `Inter` first, then system fallbacks — consistent between `input.css` `@font-face` definition, `tailwind.config.js` `fontFamily.sans`, and the preload hint in `_layouts/default.html`. ✓

4. **Known scope decisions**
   - "Learn more" inline link is specified in the spec but not used by any current section. Rather than inventing a placeholder consumer, it lives in the spec only and can be applied when copy rework introduces it.
   - Spec's non-goal list (copy, Impressum, i18n, Cal.com, logo revision) is respected — zero tasks touch those.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-19-design-md-alignment.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
