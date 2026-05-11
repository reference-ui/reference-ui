# Docs Stack Notes

## Goal

Keep the docs app lightweight and local to this package.

Do not adopt a full docs framework unless it solves a problem we actually have.

The current stack is already close to the right shape:

- Vite for build/dev
- React for rendering
- TanStack Router for app routing
- MDX for content

What still feels raw is content management: indexing docs, validating frontmatter, deriving navigation data, and eventually adding search.

## Recommendation

If we add one real tool here, it should be `@content-collections/core` with `@content-collections/vite`.

That gives us typed collections, schema validation, generated content metadata, and a cleaner replacement for the hand-rolled registry layer without forcing a new framework or app model.

This is the one change that improves management without dragging in another opinionated runtime.

## Why This Fits

Right now the package already owns rendering and routing well.

The custom part is content discovery in `src/docs-registry.ts` and the frontmatter contract passed through MDX. That is exactly the surface a content collection tool should own.

We should keep these parts:

- Vite
- React
- TanStack Router
- MDX component mapping
- existing docs layout and theme work

We should consider replacing only this part:

- manual `import.meta.glob` registry building
- manual frontmatter typing
- manual grouping and derived content metadata

## Shortlist

### 1. `@content-collections/core` + `@content-collections/vite`

Use for:

- typed docs collections
- frontmatter validation
- generated indexes and derived metadata
- keeping MDX as content without adopting a framework

Why:

- Vite-native
- active in 2026
- recent npm publish activity
- good fit for replacing the raw registry layer, not the whole app

Signal checked on 2026-05-10:

- `@content-collections/core` version `0.15.0`
- npm modified `2026-04-16`
- last week downloads about `77,785`
- GitHub `sdorra/content-collections`
- GitHub stars about `1.1k`
- GitHub last push `2026-04-25`

Recommendation level: adopt first.

### 2. `pagefind`

Use for:

- static search without shipping a search backend
- search that can be layered onto a plain Vite output

Why:

- independent from framework choice
- strong adoption
- very good fit once docs volume grows beyond a simple sidebar

Signal checked on 2026-05-10:

- version `1.5.2`
- npm modified `2026-04-12`
- last week downloads about `715,480`
- GitHub `Pagefind/pagefind`
- GitHub stars about `5.2k`
- GitHub last push `2026-05-06`

Recommendation level: add when search becomes necessary.

### 3. `rehype-pretty-code`

Use for:

- code block rendering
- syntax highlighting
- line highlighting and code annotations

Why:

- small, composable, MDX-friendly
- improves docs quality without changing docs architecture

Signal checked on 2026-05-10:

- version `0.14.3`
- npm modified `2026-03-03`
- last week downloads about `481,539`
- GitHub `rehype-pretty/rehype-pretty-code`
- GitHub stars about `1.3k`
- GitHub last push `2026-03-03`

Recommendation level: optional polish layer.

## Useful But Secondary

### `vite-plugin-pages`

This is worth considering only if we later want file-system-driven route generation.

It helps with route management, but it does not solve content schema, metadata derivation, or docs indexing by itself.

Signal checked on 2026-05-10:

- version `0.33.3`
- npm modified `2026-02-02`
- last week downloads about `62,631`
- GitHub `hannoeru/vite-plugin-pages`
- GitHub stars about `2.1k`
- GitHub last push `2026-05-09`

Recommendation level: maybe later, not the first tool to add.

## Not Recommended As The Main Move

### `contentlayer`

This used to be the obvious answer, but the maintenance signal is weaker now.

Signal checked on 2026-05-10:

- version `0.3.4`
- npm modified `2023-06-29`
- last week downloads about `26,075`

That is not dead, but it is not where I would place a fresh docs stack in 2026.

### `gray-matter`

This is a solid parser, but it is not really a management layer.

It helps read frontmatter. It does not give us typed collections, generated metadata, or a better content workflow on its own.

Use it only if we intentionally want to keep the entire system custom.

### Full Docs Frameworks

Avoid for this package unless requirements change in a major way.

That includes things like Gatsby, Astro-based docs presets, Docusaurus, or Next-first docs stacks.

Reason:

- they solve more than we need
- they replace the host app shape
- they introduce migration and integration edges
- they are exactly the class of tooling we are trying to avoid here

## Decision

If we want this package to feel less raw without going framework-heavy:

1. Add `@content-collections/core` and `@content-collections/vite`.
2. Keep the existing Vite, React, TanStack Router, and MDX architecture.
3. Add `pagefind` later when search matters.
4. Add `rehype-pretty-code` later when code presentation matters.
5. Do not adopt a full docs framework for now.

## Boundaries For A Future Implementation

If we implement this, keep the change small.

Expected replacement scope:

- replace `src/docs-registry.ts`
- keep `src/router.tsx`
- keep `src/components/DocPage`
- keep `src/components/DocLayout`
- keep MDX component overrides

The goal is to improve content management, not rebuild the docs app.