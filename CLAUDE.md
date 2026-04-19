# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jekyll-based static website for Octostack, specializing in digital identity, EUDI Wallet, and digital health infrastructure. Uses Jekyll 3.10.0 (via `github-pages` gem) for static site generation, Tailwind CSS for styling, and Lucide icons via CDN.

## Development Commands

### Initial Setup
```bash
bundle install  # Install Ruby dependencies (jekyll, github-pages gem)
npm install     # Install Node dependencies (tailwindcss, concurrently)
```

### Development
```bash
npm run dev  # Primary command: starts Jekyll + Tailwind CSS watch mode
```
Runs both Jekyll server (http://localhost:4000 with live reload) and Tailwind CSS watcher concurrently.

### Production Build
```bash
npm run build  # Builds Jekyll site, then compiles Tailwind CSS
```
Generates static site in `_site/` directory with minified CSS.

### Individual Commands
```bash
bundle exec jekyll serve --livereload  # Jekyll only
npm run watch:css                       # Tailwind only (outputs to _site/assets/css/main.css)
npm run build:css                       # Compile Tailwind CSS once
```

## Architecture

### Dual Toolchain: Jekyll + Tailwind CSS

**Dependencies:**
- `github-pages` gem (locks Jekyll to 3.10.0 and plugins to GitHub Pages versions)
- Tailwind CSS via Node.js for styling

**Critical Build Detail:**
- Tailwind source: `src/css/input.css` (contains `@tailwind` directives)
- Tailwind output: `assets/css/main.css` — written into the source tree, then copied into `_site/` by Jekyll as a regular asset. Writing directly into `_site/` doesn't work because Jekyll regenerates and wipes orphan files. The output path is gitignored (see `.gitignore`)
- Jekyll does NOT process `src/css/input.css` — `src/` is excluded via `_config.yml`
- In production (`npm run build`), Tailwind must run **before** Jekyll so Jekyll has `assets/css/main.css` to copy into `_site/`
- In dev, `concurrently` runs Tailwind watcher + `jekyll serve --livereload`; Jekyll picks up Tailwind's output on its regen loop
- Build output lives in `_site/` (gitignored); static assets under `assets/images/` and `assets/js/` are copied there by Jekyll

### Data-Driven Content Architecture

All content is separated from templates using Jekyll's data files:

**`_data/services.yml`** - Service catalog organized by category:
- `cloud`: Specialized infrastructure services (Digital Identity, EUDI Wallet, Digital Health, Cloud Infrastructure)
- `transformation`: Development & Operations services (DevOps/SRE, Software Development, Security)
- `consulting`: Advisory services (Architecture Consulting, Technical Advisory)

Each service has:
- `id`: Unique identifier (kebab-case)
- `title`: Display name
- `description`: Brief overview
- `icon`: Lucide icon name (kebab-case)
- `features`: Array of feature descriptions

**`_data/values.yml`** - Company values with title, description, and icon

**`_config.yml`** - Site-wide configuration including:
- Company information (`site.company.*`)
- Build settings and plugin configuration
- Excluded files from Jekyll processing

### Template Structure

**Single-Page Application Pattern:**
The entire site is a single page (`index.html`) with multiple sections using anchor links (`#home`, `#services`, `#about`, `#contact`). Navigation is handled via smooth scrolling JavaScript in `assets/js/main.js`.

**Layout Hierarchy:**
- `_layouts/default.html` - Base layout with `<html>`, `<head>`, `<body>`, includes header/footer
- `index.html` - Uses `layout: default`, contains all page sections
- `_includes/header.html` - Sticky header with navigation
- `_includes/footer.html` - Footer with company info and links
- `_includes/service-card.html` - Reusable component for service display

**Liquid Templating Patterns:**
```liquid
{% for service in site.data.services.cloud %}
  {% include service-card.html service=service %}
{% endfor %}
```

Services are looped by category and passed to the include using `include.service` parameter access.

### Styling System

**Tailwind CSS Configuration** (`tailwind.config.js`):
- Custom color palette matching Octostack brand:
  - `primary`: Ocean blue (#3b7ea1) - from logo stack
  - `accent`: Warm orange (#ff9955) - from logo octopus
  - `secondary`: Neutral gray scale
- Content paths include `_includes/**/*.html`, `_layouts/**/*.html`, `*.html`

**Custom CSS Source** (`src/css/input.css`):
- Contains `@tailwind` directives (base, components, utilities)
- Defines `.text-gradient` utility class for brand gradient text effect
- Never edited in `_site/` - always edit source in `src/css/`

**Auto-rebuild:** Dev server (`npm run dev`) watches for changes and auto-compiles.

### Icon System

Uses **Lucide Icons** loaded via CDN in `_layouts/default.html`. Icons are referenced using `data-lucide` attributes:
```html
<i data-lucide="cloud" class="w-8 h-8"></i>
```

Icons are initialized via `lucide.createIcons()` JavaScript call at page load.

### JavaScript Functionality

**`assets/js/main.js`** provides:
- Mobile menu toggle
- Smooth scroll navigation to anchor sections
- Active section highlighting in navigation
- Auto-close mobile menu on navigation

Key implementation: Calculates scroll position with 80px offset (header height) to determine active section.

## Deployment

Two-repo pattern: this repo (private) holds source; `octostack-de/octostack-de.github.io` (public) serves GitHub Pages at `https://octostack.de`.

- Workflow: `.github/workflows/deploy.yml`, triggers on push to `main` or manual dispatch
- Auth: a GitHub App (not a deploy key — org policy blocks deploy keys) with Contents: read/write, installed on `octostack-de.github.io` only. Secrets required in this repo: `DEPLOY_APP_ID`, `DEPLOY_APP_PRIVATE_KEY`
- Flow: `npm run build` (Tailwind → Jekyll) → `actions/create-github-app-token` mints a short-lived token → `peaceiris/actions-gh-pages` pushes `_site/` to `main` of the deploy repo and writes `CNAME: octostack.de`
- The deploy repo's contents are fully replaced on each deploy; don't hand-edit files there
