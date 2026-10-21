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

Top-level directories under `src/`: `app/` (shell), `collections/` (content
plumbing), `components/` (shared UI kits), `content/` (MDX pages plus the
private diagram gallery), `mdx/` (rendering policy), `shared/` (cross-cutting
context). File headers describe each module; Memex indexes the package map.

### `src/app` (shell chrome)

The shell is a row: a full-height `DocSidebar` rail that owns navigation
(section, then group, then pages) and the wordmark, beside a `Main` that scrolls independently. Inside `Main`, the
article and the `DocToc` outline share a centered row — the outline appears at
`>=1280px`. There is no opaque header bar — `DocHeader` floats over the article
with each control carrying its own `controlSurface`. Small viewports hide the
rail (a container query) and reveal `DocMobileNav`.

## Directory Intent

### `src/content`

The center of gravity. All `.mdx` pages live here, grouped by section. A demo
or helper used by a single page belongs next to that page, not in a shared
bucket.

`src/content/diagrams/` is the one non-MDX sibling: the specimens and the
`DiagramPage` gallery. It is content with its own route (`/diagram`, outside
the doc shell and the sidebar) rather than a collected section, so it stays
with the content it serves instead of becoming a shared bucket.

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

### `src/components`

Shared UI kits owned by docs, one folder per kit. A kit moves here only when
it serves present and future pages alike — single-page helpers stay colocated
under `src/content`. `diagram/` (canvas, panel, arrow, docs-only tokens) is
the first resident; future diagrams everywhere will compose it.

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
