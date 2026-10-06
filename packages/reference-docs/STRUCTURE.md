# Docs Package Structure

## Goal

Keep the docs package biased toward content.

The docs app should feel like:

- mostly MDX content
- a small amount of app shell
- a small amount of content plumbing

It should not drift into a generic component app where docs content and
docs-only helpers get mixed together.

## Actual Layout

```text
packages/reference-docs/
  DOCS.md
  STRUCTURE.md
  vite.config.ts
  ui.config.ts
  src/
    app/
      router.tsx          route tree and app entry wiring
      DocLayout.tsx       shell: sidebar + content frame + MDX provider
      DocSidebar.tsx      section navigation
      DocPage.tsx         slug -> MDX module rendering
      ErrorBoundary.tsx   render-error fallback
      ThemeToggle.tsx     light/dark chrome
    collections/
      content-collections.ts  config entrypoint (must live here, see below)
      docs.ts                 collection schema + transform
      index.ts                content-collections config
      runtime.ts              slug lookup for the Vite MDX runtime
    content/
      docs/...                all .mdx pages, grouped by section
    mdx/
      components.tsx          MDX -> docs visual system element mapping
    shared/
      providers/              cross-cutting React context
    main.tsx
    docs-theme.fragments.ts
    docs-syntax.css
```

## Directory Intent

### `src/content`

The center of gravity. All `.mdx` pages live here, grouped by section. A demo
or helper used by a single page belongs next to that page, not in a shared
bucket.

### `src/app`

The docs shell: routing, layout, sidebar, page rendering, error boundary, and
theme chrome. These are the pieces that make the docs behave like an app around
the content.

### `src/mdx`

MDX rendering policy: the provider component mapping, link behavior, and
heading/list/code styling. This is the translation layer between MDX and the
docs visual system, not generic shared UI.

### `src/collections`

Content discovery and metadata: schema, transforms, generated metadata
adapters, and slug lookup. Content plumbing, not app UI.

### `src/shared`

Truly shared, non-UI support code only when it is neither content-specific nor
shell-specific.

## Naming Rules

Prefer names that expose intent.

- `mdx/components.tsx`
- `collections/runtime.ts`
- `app/DocLayout.tsx`

Avoid vague buckets like `shared/components` or `utils` for content-specific
code. They hide ownership and invite accidental reuse.

## Why `content-collections.ts` Lives In `src/collections`

The content-collections watcher subscribes to the config file's own directory.
A root-level entry would watch the entire package (including `dist/`) and
exhaust file descriptors (`EMFILE: too many open files, watch`). The CLI
scripts pass `--config` and the Vite plugin passes `configPath` to point at
this file, so it stays a one-line re-export.

## Practical Rules

1. Default to colocating a React helper with the content that uses it.
2. Only move a helper to `app/`, `mdx/`, or `shared/` when it is clearly reused
   and clearly belongs to that responsibility.
3. If it shapes how MDX renders, it belongs in `mdx/`.
4. If it shapes docs metadata or route lookup, it belongs in `collections/`.
5. If it renders the shell around the document, it belongs in `app/`.

## Non-Goal

This structure is not trying to turn the docs package into a general-purpose
frontend architecture. It is intentionally a content-first docs system with a
thin runtime around it.
