# Milky Way Theme Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the site's neutral light/dark palette with a "milky-way" themed design — a night/star-sky dark mode and a parallel day/cloud-sky light mode — applied site-wide (nav, homepage, blog list, blog post, Pagefind search modal), while fixing the dead `prose` class bug on blog posts.

**Architecture:** All new visual language lives in `src/styles/global.css` as a small set of CSS custom-property tokens (background gradient, primary/secondary text, accent start/end, single accent, border, card background) plus a handful of new component classes (`.site-bg`, `.site-nav`, `.hero`, `.section`, `.post-row`, `.project-card`, `.article-content`). Existing Tailwind utility classes for generic spacing (`flex`, `gap-4`, `mb-8`, etc.) are left in place; only colors/gradients/decorative styling move to the new classes. Each Astro page/layout is updated to use the new classes instead of the old neutral Tailwind color utilities. The existing `--pf-*` Pagefind variables (already wired to `global.css` from the prior bug fix) get new values matching the new palette — no change to the variable mechanism, just new values.

**Tech Stack:** Astro 7, Tailwind CSS v4 (CSS-first, `@import "tailwindcss"`), Pagefind v1.5.2 Component UI, plain CSS custom properties for theming, `prefers-color-scheme` media query for light/dark (no manual toggle, no JS, no animation).

## Global Constraints

- No new npm dependencies (explicitly rejecting `@tailwindcss/typography` per spec — write plain CSS instead).
- No animations (stars/clouds are static `radial-gradient` layers, not animated).
- No manual dark/light toggle — `prefers-color-scheme` only.
- No mobile hamburger menu — nav stays a plain flex row at all widths.
- System font stack only (`-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`) — no web fonts.
- Exact spacing/color values must match the spec's pinned `day-night` mockup numbers (max-width 680px; nav padding 28px; hero padding `56px 0 72px`; h1 `clamp(32px, 8vw, 46px)`; section padding 44px; post-row padding 16px; project card padding `18px 20px`, `border-radius: 12px`) — do not use the earlier `layout-v2` mockup's numbers.
- Spec source of truth: `docs/superpowers/specs/2026-06-23-milky-way-theme-redesign-design.md`.

---

## Task 1: Design tokens & Pagefind search modal theme

**Files:**
- Modify: `src/styles/global.css` (whole file — replaces the existing `:root` / `@media (prefers-color-scheme: dark)` blocks)

**Interfaces:**
- Produces: CSS custom properties consumed by every later task — `--bg-gradient`, `--text-primary`, `--text-secondary`, `--accent-start`, `--accent-end`, `--accent`, `--border-color`, `--card-bg`. All later tasks reference these by name; do not rename them.
- Produces: updated `--pf-*` values (same variable names as before, new hex values) — consumed immediately by Pagefind's own `pagefind-component-ui.css` (already loaded in `BaseLayout.astro`), no markup change needed for this part.

- [ ] **Step 1: Write a failing check for the new token values**

Create `/tmp/check-tokens.js`:

```js
const { chromium } = require('playwright');
const TARGET_URL = 'http://localhost:4321/site/';

const expected = {
  light: {
    '--bg-gradient': 'linear-gradient(180deg, #cfe8ff 0%, #eef6ff 45%, #fbfdff 100%)',
    '--text-primary': '#1e2a3a',
    '--accent': '#2f6fa5',
    '--pf-text': '#1e2a3a',
    '--pf-background': '#fbfdff',
    '--pf-outline-focus': '#2f6fa5',
  },
  dark: {
    '--bg-gradient': 'radial-gradient(ellipse 90% 60% at 50% -15%, #2a1f4d 0%, #0c0a1e 55%, #060512 100%)',
    '--text-primary': '#f0eefb',
    '--accent': '#8fd8ff',
    '--pf-text': '#f0eefb',
    '--pf-background': '#0c0a1e',
    '--pf-outline-focus': '#8fd8ff',
  },
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const mode of ['light', 'dark']) {
    const page = await browser.newPage();
    await page.emulateMedia({ colorScheme: mode });
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
    const values = await page.evaluate((keys) => {
      const cs = getComputedStyle(document.documentElement);
      const out = {};
      for (const k of keys) out[k] = cs.getPropertyValue(k).trim();
      return out;
    }, Object.keys(expected[mode]));

    let failed = false;
    for (const [key, want] of Object.entries(expected[mode])) {
      if (values[key] !== want) {
        console.log(`FAIL [${mode}] ${key}: got "${values[key]}" want "${want}"`);
        failed = true;
      }
    }
    if (!failed) console.log(`PASS [${mode}] all tokens match`);
    await page.close();
  }
  await browser.close();
})();
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
cd /Users/maocaomini/Documents/phone/site && npm run dev &
sleep 2
cd "/Users/maocaomini/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill" && node run.js /tmp/check-tokens.js
```

Expected: Both `light` and `dark` print `FAIL` lines (the old neutral `--pf-*` values are in place and the new `--bg-gradient`/`--text-primary`/`--accent` tokens don't exist yet, so they read as empty strings).

- [ ] **Step 3: Replace `src/styles/global.css` with the new token set**

```css
@import "tailwindcss";

:root {
  --bg-gradient: linear-gradient(180deg, #cfe8ff 0%, #eef6ff 45%, #fbfdff 100%);
  --text-primary: #1e2a3a;
  --text-secondary: #4d6075;
  --accent-start: #2f6fa5;
  --accent-end: #e8a23a;
  --accent: #2f6fa5;
  --border-color: rgba(60, 90, 130, 0.15);
  --card-bg: rgba(255, 255, 255, 0.6);

  --pf-text: #1e2a3a;
  --pf-text-secondary: #4d6075;
  --pf-text-muted: #7d8fa3;
  --pf-background: #fbfdff;
  --pf-border: #d7e6f5;
  --pf-border-focus: #2f6fa5;
  --pf-outline-focus: #2f6fa5;
  --pf-hover: #eef6ff;
  --pf-mark: #ffe6b3;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-gradient: radial-gradient(ellipse 90% 60% at 50% -15%, #2a1f4d 0%, #0c0a1e 55%, #060512 100%);
    --text-primary: #f0eefb;
    --text-secondary: #bdb6e0;
    --accent-start: #c9b8ff;
    --accent-end: #8fd8ff;
    --accent: #8fd8ff;
    --border-color: rgba(140, 130, 200, 0.18);
    --card-bg: rgba(255, 255, 255, 0.035);

    --pf-text: #f0eefb;
    --pf-text-secondary: #bdb6e0;
    --pf-text-muted: #766fa0;
    --pf-background: #0c0a1e;
    --pf-border: #2c2657;
    --pf-border-focus: #8fd8ff;
    --pf-outline-focus: #8fd8ff;
    --pf-hover: #171340;
    --pf-mark: #3a3470;
  }
}
```

- [ ] **Step 4: Run the check again to confirm it passes**

```bash
cd "/Users/maocaomini/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill" && node run.js /tmp/check-tokens.js
```

Expected: `PASS [light] all tokens match` and `PASS [dark] all tokens match`.

- [ ] **Step 5: Visually confirm the search modal in both modes**

Stop the dev server from Step 2 first, then build and preview (Pagefind's search index only exists in a production build, not in `astro dev`):

```bash
lsof -ti:4321 | xargs kill
cd /Users/maocaomini/Documents/phone/site && npm run build && (npm run preview > /tmp/preview.log 2>&1 &)
sleep 2
```

Write `/tmp/check-pagefind-modal.js`:

```js
const { chromium } = require('playwright');
const TARGET_URL = 'http://localhost:4321/site/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const mode of ['light', 'dark']) {
    const page = await browser.newPage();
    const errors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.emulateMedia({ colorScheme: mode });
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
    await page.click('pagefind-modal-trigger');
    await page.waitForSelector('dialog.pf-modal[open]');
    await page.screenshot({ path: `/tmp/pagefind-modal-${mode}.png` });
    console.log(`${mode}: console errors = ${errors.length}`);
    await page.close();
  }
  await browser.close();
})();
```

```bash
cd "/Users/maocaomini/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill" && node run.js /tmp/check-pagefind-modal.js
```

Expected: `light: console errors = 0` and `dark: console errors = 0`. Open `/tmp/pagefind-modal-light.png` and `/tmp/pagefind-modal-dark.png` and confirm the modal background/text/focus colors look like sky-blue/gold (light) and star-purple/cyan (dark), not the old neutral black/white.

- [ ] **Step 6: Stop the preview server and commit**

```bash
lsof -ti:4321 | xargs kill
cd /Users/maocaomini/Documents/phone/site
git add src/styles/global.css
git commit -m "feat: add milky-way theme color tokens and update Pagefind palette"
```

---

## Task 2: Site background and nav styling

**Files:**
- Modify: `src/styles/global.css` (append `.site-bg` and `.site-nav` rules)
- Modify: `src/layouts/BaseLayout.astro:33-46` (apply new classes, remove old neutral Tailwind color classes)

**Interfaces:**
- Consumes: `--bg-gradient`, `--text-primary`, `--text-secondary`, `--border-color` from Task 1.
- Produces: `.site-bg` (apply to `<body>`), `.site-nav` (apply to `<nav>`) — consumed by no other task directly, but establishes the page-wide backdrop every later page renders on top of.

- [ ] **Step 1: Write a failing check for the background/nav styling**

Create `/tmp/check-bg-nav.js`:

```js
const { chromium } = require('playwright');
const TARGET_URL = 'http://localhost:4321/site/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const mode of ['light', 'dark']) {
    const page = await browser.newPage();
    await page.emulateMedia({ colorScheme: mode });
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
    const result = await page.evaluate(() => {
      const body = document.body;
      const nav = document.querySelector('nav');
      return {
        bodyHasSiteBg: body.classList.contains('site-bg'),
        navPaddingTop: nav ? getComputedStyle(nav).paddingTop : null,
        navMaxWidth: nav ? getComputedStyle(nav).maxWidth : null,
      };
    });
    console.log(mode, JSON.stringify(result));
  }
  await browser.close();
})();
```

```bash
cd /Users/maocaomini/Documents/phone/site && npm run dev > /tmp/dev.log 2>&1 &
sleep 2
cd "/Users/maocaomini/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill" && node run.js /tmp/check-bg-nav.js
```

Expected: `bodyHasSiteBg: false`, `navPaddingTop: "0px"` (the current `p-4` padding is on the `<header>`, not the `<nav>` itself), `navMaxWidth: "none"` — i.e. none of the new styling is present yet.

- [ ] **Step 2: Add `.site-bg` and `.site-nav` to `src/styles/global.css`**

Append to the end of `src/styles/global.css` (after the `@media (prefers-color-scheme: dark)` block from Task 1):

```css

body.site-bg {
  position: relative;
  overflow-x: hidden;
  min-height: 100vh;
  margin: 0;
  background: var(--bg-gradient);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body.site-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    radial-gradient(120px 60px at 18% 12%, rgba(255, 255, 255, 0.85), transparent 70%),
    radial-gradient(160px 70px at 70% 6%, rgba(255, 255, 255, 0.7), transparent 70%),
    radial-gradient(280px 140px at 50% -10%, rgba(255, 221, 150, 0.35), transparent 70%);
}

@media (prefers-color-scheme: dark) {
  body.site-bg::before {
    background-image:
      radial-gradient(1.5px 1.5px at 8% 12%, rgba(255, 255, 255, 0.9), transparent),
      radial-gradient(1px 1px at 22% 28%, rgba(255, 255, 255, 0.6), transparent),
      radial-gradient(2px 2px at 38% 8%, rgba(255, 255, 255, 0.8), transparent),
      radial-gradient(1px 1px at 55% 18%, rgba(255, 255, 255, 0.5), transparent),
      radial-gradient(1.5px 1.5px at 70% 6%, rgba(255, 255, 255, 0.7), transparent),
      radial-gradient(1px 1px at 85% 22%, rgba(255, 255, 255, 0.5), transparent),
      radial-gradient(2px 2px at 92% 10%, rgba(255, 255, 255, 0.8), transparent);
    opacity: 0.8;
  }
}

body.site-bg > * {
  position: relative;
  z-index: 1;
}

.site-nav {
  display: flex;
  gap: 32px;
  align-items: center;
  max-width: 680px;
  margin: 0 auto;
  padding: 28px 16px;
  font-size: 14px;
  border-bottom: 1px solid var(--border-color);
}

.site-nav > * {
  color: var(--text-secondary);
  text-decoration: none;
  cursor: pointer;
}

.site-nav > *:hover {
  color: var(--text-primary);
}
```

- [ ] **Step 3: Update `src/layouts/BaseLayout.astro`**

Replace lines 33-46:

```astro
  <body class="bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
    <header class="border-b border-neutral-200 dark:border-neutral-700 p-4">
      <nav class="flex gap-4">
        <a href={`${base}/`}>首頁</a>
        <a href={`${base}/blog/`}>文章</a>
        <pagefind-modal-trigger>搜尋</pagefind-modal-trigger>
      </nav>
      <pagefind-config bundle-path={`${base}/pagefind/`} base-url={`${base}/`}></pagefind-config>
      <pagefind-modal></pagefind-modal>
    </header>
    <main class="p-4" data-pagefind-body>
      <slot />
    </main>
  </body>
```

with:

```astro
  <body class="site-bg">
    <header>
      <nav class="site-nav">
        <a href={`${base}/`}>首頁</a>
        <a href={`${base}/blog/`}>文章</a>
        <pagefind-modal-trigger>搜尋</pagefind-modal-trigger>
      </nav>
      <pagefind-config bundle-path={`${base}/pagefind/`} base-url={`${base}/`}></pagefind-config>
      <pagefind-modal></pagefind-modal>
    </header>
    <main data-pagefind-body>
      <slot />
    </main>
  </body>
```

- [ ] **Step 4: Run the check again to confirm it passes**

```bash
cd "/Users/maocaomini/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill" && node run.js /tmp/check-bg-nav.js
```

Expected: `bodyHasSiteBg: true` for both modes, `navPaddingTop: "28px"`, `navMaxWidth: "680px"`.

- [ ] **Step 5: Screenshot both modes for visual confirmation**

```js
// /tmp/screenshot-home.js
const { chromium } = require('playwright');
const TARGET_URL = 'http://localhost:4321/site/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const mode of ['light', 'dark']) {
    const page = await browser.newPage();
    await page.emulateMedia({ colorScheme: mode });
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `/tmp/home-${mode}.png`, fullPage: true });
  }
  await browser.close();
})();
```

```bash
cd "/Users/maocaomini/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill" && node run.js /tmp/screenshot-home.js
```

Confirm `/tmp/home-light.png` shows the sky-blue gradient with soft cloud glows behind the (still unstyled) text, and `/tmp/home-dark.png` shows the dark purple-to-navy radial gradient with scattered stars.

- [ ] **Step 6: Stop the dev server and commit**

```bash
lsof -ti:4321 | xargs kill
cd /Users/maocaomini/Documents/phone/site
git add src/styles/global.css src/layouts/BaseLayout.astro
git commit -m "feat: apply milky-way background and nav styling to BaseLayout"
```

---

## Task 3: Hero styling on the homepage

**Files:**
- Modify: `src/styles/global.css` (append `.hero` rules)
- Modify: `src/pages/index.astro:13-20` (apply `.hero` to the intro section)

**Interfaces:**
- Consumes: `--text-secondary`, `--accent-start`, `--accent-end`, `--accent` from Task 1; relies on `.site-bg` from Task 2 already being on `<body>`.
- Produces: `.hero`, `.hero .tagline`, `.hero .links` — used only on the homepage, no other task depends on these class names.

- [ ] **Step 1: Write a failing check**

Make sure the dev server is running (skip if already running from a previous task in this session):

```bash
cd /Users/maocaomini/Documents/phone/site && npm run dev > /tmp/dev.log 2>&1 &
sleep 2
```

Create `/tmp/check-hero.js`:

```js
const { chromium } = require('playwright');
const TARGET_URL = 'http://localhost:4321/site/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
  const result = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return {
      h1Color: h1 ? getComputedStyle(h1).color : null,
      h1FontSize: h1 ? getComputedStyle(h1).fontSize : null,
    };
  });
  console.log(JSON.stringify(result));
  await browser.close();
})();
```

```bash
cd "/Users/maocaomini/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill" && node run.js /tmp/check-hero.js
```

Expected: `h1FontSize: "24px"` (current Tailwind `text-2xl`), `h1Color` is some opaque color (not `transparent`) — confirming the gradient-clip title hasn't been applied yet.

- [ ] **Step 2: Add `.hero` rules to `src/styles/global.css`**

Append:

```css

.hero {
  max-width: 680px;
  margin: 0 auto;
  padding: 56px 16px 72px;
}

.hero h1 {
  font-size: clamp(32px, 8vw, 46px);
  font-weight: 700;
  line-height: 1.15;
  margin: 0 0 16px;
  background: linear-gradient(90deg, var(--accent-start), var(--accent-end));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}

.hero .tagline {
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0 0 24px;
}

.hero .links {
  display: flex;
  gap: 22px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.hero .links a {
  font-size: 14px;
  color: var(--accent);
  text-decoration: none;
}

.hero .links a:hover {
  text-decoration: underline;
}
```

- [ ] **Step 3: Update `src/pages/index.astro`**

Replace lines 13-20:

```astro
  <section id="intro" class="mb-8">
    <h1 class="text-2xl font-bold">你的名字</h1>
    <p class="mt-2">一句自我介紹。</p>
    <ul class="mt-2 flex gap-4">
      <li><a href="mailto:you@example.com" class="underline">Email</a></li>
      <li><a href="https://github.com/IceTeaOxO" class="underline">GitHub</a></li>
    </ul>
  </section>
```

with:

```astro
  <section id="intro" class="hero">
    <h1>你的名字</h1>
    <p class="tagline">一句自我介紹。</p>
    <ul class="links">
      <li><a href="mailto:you@example.com">Email</a></li>
      <li><a href="https://github.com/IceTeaOxO">GitHub</a></li>
    </ul>
  </section>
```

- [ ] **Step 4: Run the check again to confirm it passes**

```bash
cd "/Users/maocaomini/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill" && node run.js /tmp/check-hero.js
```

Expected: `h1FontSize: "46px"` (desktop viewport resolves the `clamp()` to its max), `h1Color: "rgba(0, 0, 0, 0)"` (transparent, confirming gradient-clip text is active).

- [ ] **Step 5: Stop the dev server and commit**

```bash
lsof -ti:4321 | xargs kill
cd /Users/maocaomini/Documents/phone/site
git add src/styles/global.css src/pages/index.astro
git commit -m "feat: apply milky-way hero styling to homepage intro"
```

---

## Task 4: Section, post-row, and project-card styling

**Files:**
- Modify: `src/styles/global.css` (append `.section`, `.post-row`, `.project-card` rules)
- Modify: `src/pages/index.astro:22-43` (latest-posts and projects sections)
- Modify: `src/pages/blog/index.astro:11-23` (full post list with description)

**Interfaces:**
- Consumes: `--text-primary`, `--text-secondary`, `--accent`, `--border-color`, `--card-bg` from Task 1.
- Produces: `.section`, `.section h2`, `.post-row` (with optional `.post-date` and `.post-desc` children), `.project-card` (with `.project-name` and `.project-desc` children) — used by `index.astro` and `blog/index.astro`; no later task depends on these names beyond this task.

- [ ] **Step 1: Write a failing check**

Make sure the dev server is running (skip if already running from a previous task in this session):

```bash
cd /Users/maocaomini/Documents/phone/site && npm run dev > /tmp/dev.log 2>&1 &
sleep 2
```

Create `/tmp/check-sections.js`:

```js
const { chromium } = require('playwright');
const TARGET_URL = 'http://localhost:4321/site/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
  const result = await page.evaluate(() => {
    const h2 = document.querySelector('#latest-posts h2');
    const card = document.querySelector('.project-card');
    return {
      h2FontSize: h2 ? getComputedStyle(h2).fontSize : null,
      cardFound: !!card,
    };
  });
  console.log(JSON.stringify(result));
  await page.goto(TARGET_URL + 'blog/', { waitUntil: 'networkidle' });
  const blogResult = await page.evaluate(() => {
    const row = document.querySelector('.post-row');
    return { rowFound: !!row };
  });
  console.log(JSON.stringify(blogResult));
  await browser.close();
})();
```

```bash
cd "/Users/maocaomini/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill" && node run.js /tmp/check-sections.js
```

Expected: `h2FontSize: "20px"` (current Tailwind `text-xl`), `cardFound: false`, `rowFound: false`.

- [ ] **Step 2: Add `.section`, `.post-row`, `.project-card` rules to `src/styles/global.css`**

Append:

```css

.section {
  max-width: 680px;
  margin: 0 auto;
  padding: 44px 16px;
  border-top: 1px solid var(--border-color);
}

.section h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 22px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent);
}

.section h2::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent);
}

.post-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  padding: 16px 0;
  list-style: none;
}

.post-row + .post-row {
  border-top: 1px solid var(--border-color);
}

.post-row a {
  color: var(--text-primary);
  text-decoration: none;
  font-size: 17px;
}

.post-row a:hover {
  text-decoration: underline;
}

.post-row .post-date {
  color: var(--text-secondary);
  font-size: 13px;
  white-space: nowrap;
}

.post-row .post-desc {
  flex-basis: 100%;
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.project-card {
  list-style: none;
  padding: 18px 20px;
  border-radius: 12px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
}

.project-card .project-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 6px;
}

.project-card .project-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}
```

- [ ] **Step 3: Update `src/pages/index.astro`**

Replace lines 22-43:

```astro
  <section id="latest-posts" class="mb-8">
    <h2 class="text-xl font-bold mb-2">最新文章</h2>
    <ul class="space-y-2">
      {latestPosts.map((post) => (
        <li>
          <a href={`${base}/blog/${post.id}/`} class="underline">{post.data.title}</a>
        </li>
      ))}
    </ul>
  </section>

  <section id="projects" class="mb-8">
    <h2 class="text-xl font-bold mb-2">專案</h2>
    <ul class="space-y-2">
      {projects.map((project) => (
        <li>
          <a href={project.url} class="underline font-medium">{project.name}</a>
          <p class="text-neutral-600 dark:text-neutral-400">{project.description}</p>
        </li>
      ))}
    </ul>
  </section>
```

with:

```astro
  <section id="latest-posts" class="section">
    <h2>最新文章</h2>
    <ul>
      {latestPosts.map((post) => (
        <li class="post-row">
          <a href={`${base}/blog/${post.id}/`}>{post.data.title}</a>
          <span class="post-date">
            {post.data.pubDate.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit' })}
          </span>
        </li>
      ))}
    </ul>
  </section>

  <section id="projects" class="section">
    <h2>專案</h2>
    <ul class="space-y-3">
      {projects.map((project) => (
        <li class="project-card">
          <a class="project-name" href={project.url}>{project.name}</a>
          <p class="project-desc">{project.description}</p>
        </li>
      ))}
    </ul>
  </section>
```

- [ ] **Step 4: Update `src/pages/blog/index.astro`**

Replace lines 11-23 (the whole `<BaseLayout>` body):

```astro
<BaseLayout title="文章" description="所有文章列表">
  <h1 class="text-2xl font-bold mb-4">文章</h1>
  <ul class="space-y-4">
    {posts.map((post) => (
      <li>
        <a href={`${base}/blog/${post.id}/`} class="text-lg font-medium underline">
          {post.data.title}
        </a>
        <p class="text-neutral-600 dark:text-neutral-400">{post.data.description}</p>
      </li>
    ))}
  </ul>
</BaseLayout>
```

with:

```astro
<BaseLayout title="文章" description="所有文章列表">
  <section class="section">
    <h2>文章</h2>
    <ul>
      {posts.map((post) => (
        <li class="post-row">
          <a href={`${base}/blog/${post.id}/`}>{post.data.title}</a>
          <span class="post-date">
            {post.data.pubDate.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit' })}
          </span>
          <p class="post-desc">{post.data.description}</p>
        </li>
      ))}
    </ul>
  </section>
</BaseLayout>
```

- [ ] **Step 5: Run the check again to confirm it passes**

```bash
cd "/Users/maocaomini/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill" && node run.js /tmp/check-sections.js
```

Expected: `h2FontSize: "13px"`, `cardFound: true`, then `rowFound: true`.

- [ ] **Step 6: Screenshot homepage and blog list in both modes**

```js
// /tmp/screenshot-sections.js
const { chromium } = require('playwright');
const TARGET_URL = 'http://localhost:4321/site/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const mode of ['light', 'dark']) {
    const page = await browser.newPage();
    await page.emulateMedia({ colorScheme: mode });
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `/tmp/home-sections-${mode}.png`, fullPage: true });
    await page.goto(TARGET_URL + 'blog/', { waitUntil: 'networkidle' });
    await page.screenshot({ path: `/tmp/blog-list-${mode}.png`, fullPage: true });
  }
  await browser.close();
})();
```

```bash
cd "/Users/maocaomini/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill" && node run.js /tmp/screenshot-sections.js
```

Confirm the section labels show the small glowing dot in the accent color, post rows have a visible divider between them (not before the first), and project cards have a subtle translucent background distinguishable from the page background, in both light and dark screenshots.

- [ ] **Step 7: Stop the dev server and commit**

```bash
lsof -ti:4321 | xargs kill
cd /Users/maocaomini/Documents/phone/site
git add src/styles/global.css src/pages/index.astro src/pages/blog/index.astro
git commit -m "feat: apply milky-way section, post-row, and project-card styling"
```

---

## Task 5: Article content styling (fixes dead `prose` class)

**Files:**
- Modify: `src/styles/global.css` (append `.article-content` rules)
- Modify: `src/pages/blog/[...slug].astro:18` (replace `prose dark:prose-invert` with `article-content`)

**Interfaces:**
- Consumes: `--text-primary`, `--text-secondary`, `--accent`, `--border-color`, `--card-bg` from Task 1.
- Produces: `.article-content` and its descendant selectors (`h1`, `h2`, `h3`, `p`, `a`, `ul`/`ol`/`li`, `code`, `pre`, `blockquote`) — used only by the blog post page.

- [ ] **Step 1: Write a failing check**

Make sure the dev server is running (skip if already running from a previous task in this session):

```bash
cd /Users/maocaomini/Documents/phone/site && npm run dev > /tmp/dev.log 2>&1 &
sleep 2
```

Create `/tmp/check-article.js`:

```js
const { chromium } = require('playwright');
const TARGET_URL = 'http://localhost:4321/site/blog/hello-world/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
  const result = await page.evaluate(() => {
    const article = document.querySelector('article');
    return {
      hasProseClass: article ? article.classList.contains('prose') : null,
      hasArticleContentClass: article ? article.classList.contains('article-content') : null,
      articleMaxWidth: article ? getComputedStyle(article).maxWidth : null,
    };
  });
  console.log(JSON.stringify(result));
  await browser.close();
})();
```

```bash
cd "/Users/maocaomini/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill" && node run.js /tmp/check-article.js
```

Expected: `hasProseClass: true`, `hasArticleContentClass: false`, `articleMaxWidth: "none"` — the `prose`/`dark:prose-invert` classes have zero effect (no typography plugin installed), so the article stretches full-width instead of matching the 680px column used everywhere else on the site (note: by this point Task 2's `body.site-bg` already fixed the base text color via inheritance, so the article text itself is no longer black-on-dark — the remaining visible problems are the dead class and the inconsistent width/typography, which this task fixes).

- [ ] **Step 2: Add `.article-content` rules to `src/styles/global.css`**

Append:

```css

.article-content {
  max-width: 680px;
  margin: 0 auto;
  padding: 44px 16px 72px;
  font-size: 16px;
  line-height: 1.75;
  color: var(--text-primary);
}

.article-content h1 {
  font-size: clamp(28px, 6vw, 38px);
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 24px;
}

.article-content h2 {
  font-size: 22px;
  font-weight: 700;
  margin: 40px 0 16px;
}

.article-content h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 32px 0 12px;
}

.article-content p {
  margin: 0 0 20px;
}

.article-content a {
  color: var(--accent);
  text-decoration: underline;
}

.article-content ul,
.article-content ol {
  margin: 0 0 20px;
  padding-left: 1.4em;
}

.article-content li {
  margin: 0 0 8px;
}

.article-content code {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.9em;
}

.article-content pre {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
  margin: 0 0 20px;
}

.article-content pre code {
  background: none;
  border: none;
  padding: 0;
}

.article-content blockquote {
  margin: 0 0 20px;
  padding-left: 16px;
  border-left: 3px solid var(--border-color);
  color: var(--text-secondary);
}
```

- [ ] **Step 3: Update `src/pages/blog/[...slug].astro`**

Replace line 18:

```astro
  <article class="prose dark:prose-invert">
```

with:

```astro
  <article class="article-content">
```

- [ ] **Step 4: Run the check again to confirm it passes**

```bash
cd "/Users/maocaomini/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill" && node run.js /tmp/check-article.js
```

Expected: `hasProseClass: false`, `hasArticleContentClass: true`, `articleMaxWidth: "680px"` — the article now matches the same content column width used by the nav, hero, and sections.

- [ ] **Step 5: Screenshot the blog post in both modes**

```js
// /tmp/screenshot-post.js
const { chromium } = require('playwright');
const TARGET_URL = 'http://localhost:4321/site/blog/hello-world/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const mode of ['light', 'dark']) {
    const page = await browser.newPage();
    await page.emulateMedia({ colorScheme: mode });
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `/tmp/post-${mode}.png`, fullPage: true });
  }
  await browser.close();
})();
```

```bash
cd "/Users/maocaomini/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill" && node run.js /tmp/screenshot-post.js
```

Confirm both screenshots show legible text (no black-on-dark or white-on-light mismatches) and links in the accent color.

- [ ] **Step 6: Stop the dev server and commit**

```bash
lsof -ti:4321 | xargs kill
cd /Users/maocaomini/Documents/phone/site
git add src/styles/global.css "src/pages/blog/[...slug].astro"
git commit -m "fix: replace dead prose class with article-content styling on blog posts"
```

---

## Task 6: Full-site verification (production build)

**Files:**
- None (verification only — no source changes).

**Interfaces:**
- Consumes: everything produced by Tasks 1-5.

- [ ] **Step 1: Build and preview the production site**

```bash
cd /Users/maocaomini/Documents/phone/site
npm run build
(npm run preview > /tmp/preview-final.log 2>&1 &)
sleep 2
```

- [ ] **Step 2: Run a comprehensive cross-page, cross-mode check**

Create `/tmp/check-full-site.js`:

```js
const { chromium } = require('playwright');
const BASE = 'http://localhost:4321/site/';
const pages = ['', 'blog/', 'blog/hello-world/'];

(async () => {
  const browser = await chromium.launch({ headless: true });
  let anyFail = false;

  for (const mode of ['light', 'dark']) {
    for (const path of pages) {
      const page = await browser.newPage();
      const errors = [];
      page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
      page.on('pageerror', (err) => errors.push(err.message));
      await page.emulateMedia({ colorScheme: mode });
      await page.goto(BASE + path, { waitUntil: 'networkidle' });
      const slug = path === '' ? 'home' : path.replace(/\/$/, '').replace(/\//g, '-');
      await page.screenshot({ path: `/tmp/full-${slug}-${mode}.png`, fullPage: true });
      if (errors.length > 0) {
        anyFail = true;
        console.log(`FAIL [${mode}] ${BASE + path} console errors:`, errors);
      } else {
        console.log(`PASS [${mode}] ${BASE + path} zero console errors`);
      }
      await page.close();
    }

    // search modal check on the homepage
    const page = await browser.newPage();
    const errors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.emulateMedia({ colorScheme: mode });
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.click('pagefind-modal-trigger');
    await page.waitForSelector('dialog.pf-modal[open]');
    await page.fill('input.pf-input', 'hello');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `/tmp/full-search-${mode}.png` });
    if (errors.length > 0) {
      anyFail = true;
      console.log(`FAIL [${mode}] search modal console errors:`, errors);
    } else {
      console.log(`PASS [${mode}] search modal zero console errors`);
    }
    await page.close();
  }

  await browser.close();
  console.log(anyFail ? 'OVERALL: FAIL' : 'OVERALL: PASS');
})();
```

```bash
cd "/Users/maocaomini/.claude/plugins/marketplaces/playwright-skill/skills/playwright-skill" && node run.js /tmp/check-full-site.js
```

Expected: every line prints `PASS`, ending with `OVERALL: PASS`.

- [ ] **Step 3: Manually review every screenshot**

Open all of `/tmp/full-home-light.png`, `/tmp/full-home-dark.png`, `/tmp/full-blog-light.png`, `/tmp/full-blog-dark.png`, `/tmp/full-blog-hello-world-light.png`, `/tmp/full-blog-hello-world-dark.png`, `/tmp/full-search-light.png`, `/tmp/full-search-dark.png`. Confirm for each: no leftover black-on-dark or white-on-light text, the day pages read as a coherent sky/cloud theme and the night pages read as a coherent star/space theme, and the search modal palette matches its page's theme.

- [ ] **Step 4: Stop the preview server**

```bash
lsof -ti:4321 | xargs kill
```

No commit for this task — it's verification only, confirming the prior five commits together produce a working, visually consistent site.
