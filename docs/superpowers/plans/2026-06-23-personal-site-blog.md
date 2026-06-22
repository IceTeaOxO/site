# 個人首頁 + 部落格 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static Astro site (personal homepage + blog) and deploy it to GitHub Pages at `https://IceTeaOxO.github.io/site/`.

**Architecture:** A from-scratch Astro 7 project (TypeScript strict, no theme template) styled with Tailwind CSS v4. Blog posts live in an Astro content collection (Content Layer API, Markdown files); the projects list is a plain TypeScript data array. Site-wide search is pre-built at build time by the Pagefind CLI (not the `astro-pagefind` npm integration — see note in Task 6). GitHub Actions builds and deploys the static output to GitHub Pages on every push to `main`.

**Tech Stack:** Astro 7 (static output), TypeScript (strict), Tailwind CSS v4 (`@tailwindcss/vite`), `@astrojs/rss`, Pagefind CLI (devDependency, run as a `postbuild` npm script), GoatCounter (analytics, via a runtime env var), GitHub Actions (`withastro/action@v6` + `actions/deploy-pages@v5`).

## Global Constraints

- Repo: `IceTeaOxO/site` (project-page repo). Working directory for all tasks: `/Users/maocaomini/Documents/phone/site`.
- `astro.config.mjs` must set `site: 'https://IceTeaOxO.github.io'` and `base: '/site'` (temporary — will be removed later when a custom domain is set up; that change is out of scope for this plan).
- **Base-path gotcha (verified empirically while writing this plan):** Astro's `base` config does **not** automatically rewrite hand-written `href`/`src` attributes — only `import.meta.env.BASE_URL` reflects it. Every internal link or absolute asset path written in this project's code must be built as `` `${import.meta.env.BASE_URL}/...` `` (note: `BASE_URL` resolves to `/site`, with no trailing slash, when `base: '/site'` is configured).
- No tags/categories, no MDX, no i18n. Chinese only (`lang="zh-TW"` on every page).
- No off-the-shelf Astro theme — built from the official `minimal` starter template only.
- Blog posts: Astro content collection at `src/content/blog/*.md`. Projects list: plain array at `src/data/projects.ts` (not a collection).
- Visual theme: neutral light/dark (not the "Milky Way" theme's space aesthetic) — implemented via Tailwind's default `dark:` variant, which compiles to a `prefers-color-scheme: dark` media query (verified empirically; no manual theme toggle needed).

---

### Task 1: Scaffold the Astro project with the GitHub Pages base path

**Files:**
- Delete: `README.md`, `.gitignore` (the placeholder versions GitHub created when the repo was made — removing them first is required so the scaffolder writes directly into `.` instead of creating a randomly-named subdirectory; verified empirically: `create-astro` treats any visible file in the target directory as "not empty" and refuses to scaffold in place)
- Create (via scaffolder): `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `README.md`, `src/pages/index.astro`, `public/favicon.ico`, `public/favicon.svg`
- Delete (generated boilerplate not needed): `AGENTS.md`, `CLAUDE.md`, `.vscode/`
- Modify: `astro.config.mjs` (add `site`/`base`)

**Interfaces:**
- Produces: `astro.config.mjs` exporting a config with `site: 'https://IceTeaOxO.github.io'` and `base: '/site'`. Every later task that writes a link or asset path depends on `import.meta.env.BASE_URL` resolving to `/site`.

- [ ] **Step 1: Remove the placeholder files so the scaffolder can write into `.`**

```bash
cd /Users/maocaomini/Documents/phone/site
rm -f README.md .gitignore
```

- [ ] **Step 2: Run the scaffolder**

```bash
npx --yes create-astro@latest . --template minimal --install --no-git --typescript strict --yes
```

Expected: output includes `Using . as project directory` (not a randomly generated name like `flaky-fireball`) and ends with `✔ Project initialized!`.

- [ ] **Step 3: Verify the scaffold builds**

```bash
npm run build
test -f dist/index.html && echo PASS || echo FAIL
```

Expected: `PASS`

- [ ] **Step 4: Remove generated boilerplate this project doesn't need**

```bash
rm -rf AGENTS.md CLAUDE.md .vscode
```

- [ ] **Step 5: Set the GitHub Pages `site`/`base` config**

Edit `astro.config.mjs` to read exactly:

```js
// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://IceTeaOxO.github.io',
  base: '/site',
});
```

- [ ] **Step 6: Verify the build still succeeds with the base path set**

```bash
rm -rf dist
npm run build
test -f dist/index.html && echo PASS || echo FAIL
```

Expected: `PASS`

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro project with GitHub Pages base path"
```

---

### Task 2: Add Tailwind CSS v4 and the shared BaseLayout

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Modify: `astro.config.mjs` (via `astro add tailwind`)
- Create: `src/styles/global.css` (via `astro add tailwind`)
- Modify: `src/pages/index.astro` (temporary placeholder using the new layout — fully replaced in Task 4)

**Interfaces:**
- Consumes: `astro.config.mjs` from Task 1 (`base: '/site'`)
- Produces: `src/layouts/BaseLayout.astro` — a component with `Props { title: string; description: string }`, rendering `<html lang="zh-TW">`, a `<head>` with the page title/description, a `<header>` with nav links to `/` and `/blog/`, and a `<main><slot /></main>`. Every page-level task after this one imports and wraps its content in `BaseLayout`.

- [ ] **Step 1: Add the Tailwind integration**

```bash
npx astro add tailwind --yes
```

Expected: ends with `success  Added the following integration to your project: - tailwind`. This creates `src/styles/global.css` containing `@import "tailwindcss";` and adds the `@tailwindcss/vite` plugin to `astro.config.mjs`.

- [ ] **Step 2: Write a failing build check for the BaseLayout's dark-mode styling**

```bash
npm run build
grep -rl "neutral-900" dist/_astro/*.css 2>/dev/null && echo PASS || echo FAIL
```

Expected: `FAIL` (no layout exists yet, so the class is never used and Tailwind never generates it)

- [ ] **Step 3: Create the BaseLayout**

Create `src/layouts/BaseLayout.astro`:

```astro
---
import '../styles/global.css';

interface Props {
  title: string;
  description: string;
}

const { title, description } = Astro.props;
const base = import.meta.env.BASE_URL;
---

<!DOCTYPE html>
<html lang="zh-TW">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" type="image/svg+xml" href={`${base}/favicon.svg`} />
    <meta name="viewport" content="width=device-width" />
    <meta name="description" content={description} />
    <meta name="generator" content={Astro.generator} />
    <title>{title}</title>
  </head>
  <body class="bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
    <header class="border-b border-neutral-200 dark:border-neutral-700 p-4">
      <nav class="flex gap-4">
        <a href={`${base}/`}>首頁</a>
        <a href={`${base}/blog/`}>文章</a>
      </nav>
    </header>
    <main class="p-4">
      <slot />
    </main>
  </body>
</html>
```

- [ ] **Step 4: Update the placeholder homepage to use the layout**

Replace the contents of `src/pages/index.astro` with:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="首頁" description="個人首頁與部落格">
  <p>placeholder</p>
</BaseLayout>
```

- [ ] **Step 5: Run the build check again and verify it now passes**

```bash
rm -rf dist
npm run build
grep -rl "neutral-900" dist/_astro/*.css 2>/dev/null && echo PASS || echo FAIL
```

Expected: `PASS`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Tailwind CSS v4 and shared BaseLayout"
```

---

### Task 3: Blog content collection, sample post, and blog pages

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/blog/hello-world.md`
- Create: `src/pages/blog/index.astro`
- Create: `src/pages/blog/[...slug].astro`

**Interfaces:**
- Consumes: `BaseLayout` from Task 2 (`Props { title: string; description: string }`)
- Produces: a `blog` content collection (schema: `{ title: string; description: string; pubDate: Date }`), readable via `getCollection('blog')` from `astro:content`. Task 4 (homepage "latest posts" section) and Task 5 (RSS feed) both depend on this schema and on post URLs being `` `${import.meta.env.BASE_URL}/blog/${post.id}/` ``.

- [ ] **Step 1: Write the collection config and a failing build check**

Create `src/content.config.ts`:

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
  }),
});

export const collections = { blog };
```

```bash
mkdir -p src/content/blog
npm run build
test -f dist/blog/hello-world/index.html && echo PASS || echo FAIL
```

Expected: `FAIL` (no post file and no blog pages exist yet)

- [ ] **Step 2: Add the sample post**

Create `src/content/blog/hello-world.md`:

```md
---
title: "第一篇文章"
description: "這是這個部落格的第一篇文章，用來驗證部落格功能是否正常運作。"
pubDate: 2026-06-23
---

這是第一篇文章的內容，之後會換成真正想寫的東西。
```

- [ ] **Step 3: Create the blog index page**

Create `src/pages/blog/index.astro`:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

const posts = (await getCollection('blog')).sort(
  (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
);
const base = import.meta.env.BASE_URL;
---

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

- [ ] **Step 4: Create the individual post page**

Create `src/pages/blog/[...slug].astro`:

```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---

<BaseLayout title={post.data.title} description={post.data.description}>
  <article class="prose dark:prose-invert">
    <h1>{post.data.title}</h1>
    <Content />
  </article>
</BaseLayout>
```

- [ ] **Step 5: Run the build check again and verify it passes**

```bash
rm -rf dist
npm run build
test -f dist/blog/hello-world/index.html && echo PASS || echo FAIL
grep -q "第一篇文章" dist/blog/hello-world/index.html && echo PASS || echo FAIL
grep -q "/site/blog/hello-world/" dist/blog/index.html && echo PASS || echo FAIL
```

Expected: `PASS` for all three checks (the third confirms the link was built with the `/site` base path, not a bare `/blog/...` path)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add blog content collection and blog pages"
```

---

### Task 4: Homepage (intro, latest posts, projects) and projects data

**Files:**
- Create: `src/data/projects.ts`
- Modify: `src/pages/index.astro` (replace the Task 2 placeholder with the real three-section homepage)

**Interfaces:**
- Consumes: `BaseLayout` from Task 2; `getCollection('blog')` from Task 3 (same schema: `title`, `description`, `pubDate`)
- Produces: `src/data/projects.ts` exporting `projects: { name: string; description: string; url: string }[]` — a plain array, not a content collection, per spec.

- [ ] **Step 1: Write a failing build check for the homepage sections**

```bash
npm run build
grep -q "id=\"projects\"" dist/index.html && echo PASS || echo FAIL
```

Expected: `FAIL` (homepage is still the Task 2 placeholder)

- [ ] **Step 2: Create the projects data file**

Create `src/data/projects.ts`:

```ts
export interface Project {
  name: string;
  description: string;
  url: string;
}

export const projects: Project[] = [
  {
    name: "範例專案",
    description: "這是一個範例專案說明，之後換成真正的專案內容。",
    url: "https://github.com/IceTeaOxO",
  },
];
```

- [ ] **Step 3: Build the real homepage**

Replace the contents of `src/pages/index.astro` with:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import { projects } from '../data/projects.ts';

const latestPosts = (await getCollection('blog'))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
  .slice(0, 3);
const base = import.meta.env.BASE_URL;
---

<BaseLayout title="首頁" description="個人首頁與部落格">
  <section id="intro" class="mb-8">
    <h1 class="text-2xl font-bold">你的名字</h1>
    <p class="mt-2">一句自我介紹。</p>
    <ul class="mt-2 flex gap-4">
      <li><a href="mailto:you@example.com" class="underline">Email</a></li>
      <li><a href="https://github.com/IceTeaOxO" class="underline">GitHub</a></li>
    </ul>
  </section>

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
</BaseLayout>
```

- [ ] **Step 4: Run the build check again and verify it passes**

```bash
rm -rf dist
npm run build
grep -q "id=\"projects\"" dist/index.html && echo PASS || echo FAIL
grep -q "id=\"latest-posts\"" dist/index.html && echo PASS || echo FAIL
grep -q "第一篇文章" dist/index.html && echo PASS || echo FAIL
```

Expected: `PASS` for all three (the third confirms the sample post from Task 3 shows up in the latest-posts section)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: build homepage with intro, latest posts, and projects sections"
```

---

### Task 5: RSS feed

**Files:**
- Create: `src/pages/rss.xml.js`

**Interfaces:**
- Consumes: `getCollection('blog')` from Task 3; `site`/`base` from `astro.config.mjs` (Task 1)
- Produces: `/rss.xml` (served at `/site/rss.xml` once deployed)

- [ ] **Step 1: Install `@astrojs/rss`**

```bash
npm install @astrojs/rss
```

- [ ] **Step 2: Write a failing build check**

```bash
npm run build
test -f dist/rss.xml && echo PASS || echo FAIL
```

Expected: `FAIL`

- [ ] **Step 3: Create the RSS endpoint**

Create `src/pages/rss.xml.js`:

```js
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog');
  const base = import.meta.env.BASE_URL;
  return rss({
    title: '個人首頁與部落格',
    description: '最新文章 RSS feed',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `${base}/blog/${post.id}/`,
    })),
  });
}
```

Note: `link` is built with `import.meta.env.BASE_URL`, not a bare `/blog/...` path — without this prefix the feed's item links point to the wrong path once deployed under `/site` (verified empirically while writing this plan: the `rss()` helper does not apply the configured `base` to item links automatically).

- [ ] **Step 4: Run the build check again and verify it passes**

```bash
rm -rf dist
npm run build
test -f dist/rss.xml && echo PASS || echo FAIL
grep -q "https://IceTeaOxO.github.io/site/blog/hello-world/" dist/rss.xml && echo PASS || echo FAIL
```

Expected: `PASS` for both

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add RSS feed"
```

---

### Task 6: Site-wide search (Pagefind)

**Files:**
- Modify: `package.json` (add `pagefind` devDependency and a `postbuild` script)
- Modify: `src/layouts/BaseLayout.astro` (add the Pagefind Component UI markup and `data-pagefind-body`)

**Interfaces:**
- Consumes: `BaseLayout` from Task 2 (modifies it directly — this is the only task that touches it after Task 2)
- Produces: a search modal available on every page via `<pagefind-modal-trigger>` / `<pagefind-modal>`, wired up by `dist/pagefind/pagefind-component-ui.js` (generated by the `postbuild` script, not bundled by Astro)

**Important note — do not use the `astro-pagefind` npm package.** Verified empirically while writing this plan: `astro-pagefind@2.0.0`'s peer dependency only allows `astro@"^2.0.4 || ^3 || ^4 || ^5 || ^6"`, and this project uses Astro 7, so `npm install astro-pagefind` fails with an unresolvable `ERESOLVE` peer-dependency conflict. Instead, use the vanilla `pagefind` CLI as a `postbuild` step — it operates on the built `dist/` HTML directly and has no dependency on Astro's integration API, so it works regardless of Astro's version.

**Known limitation to be aware of:** because indexing only happens in the `postbuild` step, search will **not** work in `npm run dev`. It only works after `npm run build` (which runs `postbuild` automatically), e.g. when previewing with `npm run preview` or once deployed.

- [ ] **Step 1: Write a failing check for the search index existing**

```bash
rm -rf dist
npm run build
test -f dist/pagefind/pagefind.js && echo PASS || echo FAIL
```

Expected: `FAIL` (no `postbuild` step exists yet, so nothing indexes `dist/`)

- [ ] **Step 2: Install the Pagefind CLI as a devDependency**

```bash
npm install -D pagefind
```

- [ ] **Step 3: Add the `postbuild` script**

Edit `package.json`, add to the `"scripts"` object:

```json
"postbuild": "pagefind --site dist"
```

- [ ] **Step 4: Run the check again and verify the index now exists**

```bash
rm -rf dist
npm run build
test -f dist/pagefind/pagefind.js && echo PASS || echo FAIL
```

Expected: `PASS` (the `postbuild` script indexes whatever HTML is in `dist/`, regardless of UI markup — that's why this check passes before the UI exists; Steps 5–7 add the UI itself)

- [ ] **Step 5: Write a failing check for the search UI markup**

```bash
grep -q "pagefind-component-ui.js" dist/index.html && echo PASS || echo FAIL
```

Expected: `FAIL` (nothing references the Pagefind UI yet)

- [ ] **Step 6: Add the search UI and indexing scope to BaseLayout**

Edit `src/layouts/BaseLayout.astro`. Add inside `<head>`, after the existing `<meta name="generator" ...>` line:

```astro
    <link href={`${base}/pagefind/pagefind-component-ui.css`} rel="stylesheet" />
    <script src={`${base}/pagefind/pagefind-component-ui.js`} type="module"></script>
```

Add inside `<nav>`, after the existing two `<a>` links:

```astro
        <pagefind-modal-trigger>搜尋</pagefind-modal-trigger>
```

Add `<pagefind-modal></pagefind-modal>` directly after the closing `</nav>` tag (still inside `<header>`).

Change `<main class="p-4">` to `<main class="p-4" data-pagefind-body>` so Pagefind indexes only the page content, not the header/nav.

- [ ] **Step 7: Run the build and verify the UI markup check now passes**

```bash
rm -rf dist
npm run build
test -f dist/pagefind/pagefind-component-ui.js && echo PASS || echo FAIL
grep -q "/site/pagefind/pagefind-component-ui.js" dist/index.html && echo PASS || echo FAIL
```

Expected: `PASS` for both (the second confirms the script `src` was built with the `/site` base prefix)

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add site-wide search with Pagefind"
```

---

### Task 7: GoatCounter analytics

**Files:**
- Create: `.env.example`
- Modify: `src/layouts/BaseLayout.astro` (conditionally render the GoatCounter script)

**Interfaces:**
- Consumes: `BaseLayout` from Task 2/6 (modifies it directly)
- Produces: a `PUBLIC_GOATCOUNTER_CODE` environment variable read via `import.meta.env.PUBLIC_GOATCOUNTER_CODE`. **User action required, outside this plan's scope:** sign up at goatcounter.com to get a real site code, then create a local `.env` file (gitignored already, via the `.gitignore` Astro generated in Task 1) with `PUBLIC_GOATCOUNTER_CODE=<real code>`, and add the same variable as a repository secret/variable for the GitHub Actions build in Task 8.

- [ ] **Step 1: Add `.env.example`**

Create `.env.example`:

```
PUBLIC_GOATCOUNTER_CODE=
```

- [ ] **Step 2: Write a failing test for the positive case (env var set → script renders)**

```bash
PUBLIC_GOATCOUNTER_CODE=test123 npm run build
grep -q 'data-goatcounter="https://test123.goatcounter.com/count"' dist/index.html && echo PASS || echo FAIL
```

Expected: `FAIL` (BaseLayout doesn't render anything yet)

- [ ] **Step 3: Add the conditional script to BaseLayout**

Edit `src/layouts/BaseLayout.astro`. Add to the frontmatter (the `---` block at the top), after `const base = import.meta.env.BASE_URL;`:

```astro
const goatcounterCode = import.meta.env.PUBLIC_GOATCOUNTER_CODE;
```

Add inside `<head>`, as the last child before `</head>`:

```astro
    {goatcounterCode && (
      <script
        data-goatcounter={`https://${goatcounterCode}.goatcounter.com/count`}
        async
        src="//gc.zgo.at/count.js"
      ></script>
    )}
```

- [ ] **Step 4: Run the positive-case check again and verify it passes**

```bash
rm -rf dist
PUBLIC_GOATCOUNTER_CODE=test123 npm run build
grep -q 'data-goatcounter="https://test123.goatcounter.com/count"' dist/index.html && echo PASS || echo FAIL
```

Expected: `PASS`

- [ ] **Step 5: Verify the negative case (no env var → no script tag)**

```bash
rm -rf dist
npm run build
grep -q "data-goatcounter" dist/index.html && echo FAIL || echo PASS
```

Expected: `PASS` (confirms the site still builds cleanly with no script tag before the user has a real GoatCounter code)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add GoatCounter analytics behind an env var"
```

---

### Task 8: GitHub Actions deployment workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `astro.config.mjs` (`site`/`base`) from Task 1; the full build from Tasks 1–7 (this task's verification step builds the entire site end-to-end)

- [ ] **Step 1: Create the workflow file**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout your repository using git
        uses: actions/checkout@v6
      - name: Install, build, and upload your site output
        uses: withastro/action@v6

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 2: Validate the YAML is well-formed**

```bash
node -e "const fs=require('fs'); const c=fs.readFileSync('.github/workflows/deploy.yml','utf8'); if(!c.includes('withastro/action@v6')||!c.includes('actions/deploy-pages@v5')) process.exit(1); console.log('PASS')"
```

Expected: `PASS`

- [ ] **Step 3: Run the full end-to-end build as a final sanity check**

```bash
rm -rf dist node_modules/.astro
npm run build
test -f dist/index.html && echo PASS || echo FAIL
test -f dist/blog/hello-world/index.html && echo PASS || echo FAIL
test -f dist/rss.xml && echo PASS || echo FAIL
test -f dist/pagefind/pagefind.js && echo PASS || echo FAIL
```

Expected: `PASS` for all four

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "ci: add GitHub Actions workflow to deploy to GitHub Pages"
```

- [ ] **Step 5: Manual follow-up steps (cannot be done from this repo/plan)**

These are real prerequisites, not placeholders — list them for the user to do once, outside of any task's code:
1. Push this repo to `origin main` on GitHub.
2. In the repo's Settings → Pages, set "Source" to "GitHub Actions".
3. Sign up at goatcounter.com, get a real site code, and add it as a repository variable named `PUBLIC_GOATCOUNTER_CODE` (Settings → Secrets and variables → Actions → Variables) so the Actions build in Task 8 picks it up; also set it in a local `.env` file for local builds (see Task 7).
