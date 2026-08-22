# Docs Package Structure

## Goal

Keep the docs package biased toward content.

The docs app should feel like:

- mostly MDX content
- a small amount of app shell
- a small amount of content plumbing

It should not drift into a generic component app where docs content and docs-only helpers get mixed together.

## Core Rule

If a React component exists only to support one page or one small docs section, keep it next to that content under `src/content`.

Do not promote docs-only helper components into a broad shared bucket just because they are React components.

That is the main guardrail.

## Preferred Top-Level Split

Inside `src`, prefer these responsibilities:

- `content/`
  MDX documents and page-local helper components
- `collections/`
  content-collections config and runtime adapters
- `app/`
  docs app shell: layout, sidebar, route entry, error boundaries
- `mdx/`
  MDX rendering policy: provider components, link handling, element mapping
- `shared/`
  truly shared non-UI support code only when it is not content-specific and not app-shell-specific

## Proposed Shape

Target structure:

```text
packages/reference-docs/
  content-collections.ts
  DOCS.md
  STRUCTURE.md
  vite.config.ts
  src/
    app/
      layout/
      routing/
      ThemeToggle.tsx
      ErrorBoundary/
    collections/
      README.md
      docs.ts
      index.ts
      runtime.ts
    content/
      docs/
        getting-started/
          intro.mdx
          get-started.mdx
          get-started.demo.tsx
        foundations/
        reference/
    mdx/
      components.tsx
    shared/
      providers/
```

This is a direction, not a demand for immediate churn.

## Directory Intent

### `src/content`

This is the center of gravity.

Put here:

- all `.mdx` pages
- page-local demo components
- section-local helper components
- assets or support files that only exist for docs content

Example:

```text
src/content/docs/getting-started/
  intro.mdx
  intro.demo.tsx
  _components.tsx
```

If a component is only used by `intro.mdx`, it belongs here.

If two or three files in the same section use the same helper, it can still live here.

### `src/collections`

This owns content discovery and metadata.

Put here:

- content-collections schemas
- transforms
- generated metadata adapters
- runtime lookup helpers such as slug-to-module mapping

This is content plumbing, not app UI.

### `src/app`

This owns the docs shell.

Put here:

- overall layout
- sidebar
- route entry logic
- error boundaries
- theme chrome

These are the pieces that make the docs behave like an app around the content.

### `src/mdx`

This owns MDX rendering policy.

Put here:

- `MDXProvider` component mapping
- custom link behavior
- heading/list/code rendering policy

This is not generic shared UI. It is the translation layer between MDX and the docs visual system.

### `src/shared`

Use this sparingly.

Good candidates:

- providers
- generic hooks
- low-level helpers with no content coupling and no app-shell coupling

Bad candidates:

- page demos
- docs-only presentational helpers
- section-specific examples
- anything that exists mainly to make one MDX page work

## Naming Rules

Prefer names that expose intent.

Good:

- `mdx/components.tsx`
- `collections/runtime.ts`
- `content/docs/getting-started/intro.demo.tsx`
- `content/docs/reference/button/_components.tsx`

Avoid vague names like:

- `shared/components`
- `utils` for content-specific code
- `common` for page-local helpers

Those names tend to hide ownership and invite accidental reuse.

## Practical Rules

### Rule 1

Default to colocating React helpers with the page that uses them.

### Rule 2

Only move a helper out of `content/` when it is clearly reused across unrelated pages and still belongs to either `mdx/`, `app/`, or `shared/`.

### Rule 3

If a file exists to shape how MDX renders, it belongs under `mdx/`, not `components/`.

### Rule 4

If a file exists to shape docs metadata or route lookup, it belongs under `collections/`.

### Rule 5

If a file exists to render the shell around the document, it belongs under `app/`.

## What This Means For The Current Package

Likely moves over time:

- move `src/components/mdxComponents.tsx` to `src/mdx/components.tsx`
- move shell-oriented files out of `src/components/` into `src/app/`
- keep `src/collections/` as the content metadata boundary
- keep docs demos and page helpers inside `src/content/docs/...`

The goal is not to create more folders.

The goal is to make ownership obvious:

- content stays with content
- shell stays with shell
- MDX policy stays with MDX
- collection plumbing stays with collection plumbing

## Non-Goal

This structure is not trying to turn the docs package into a general-purpose frontend architecture.

It is intentionally biased toward a content-first docs system with a thin runtime around it.