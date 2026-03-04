# Primitives

React components that read from the styled package (`@reference-ui/styled`).

## Source

This folder will be populated from **@reference-ui/core** `src/primitives`:

- `index.tsx` — HTML primitives (Div, H1, P, Span, etc.)
- `types.ts` — `PrimitiveElement`, `PrimitiveProps` (import from `@reference-ui/styled/types/jsx`)
- `tags.ts` — `HTML_TAGS`, `HtmlTag`
- `recipes.ts` — recipe exports for typography
- `primitives/css/*.style.ts` — per-tag style recipes

## Dependencies

Primitives import from:

- **@reference-ui/styled** — Panda output: `styled`, `cva`, patterns, types
- **system/patterns** — `box` pattern
- **system/recipes** — typography recipes (h1Style, pStyle, etc.)

## Flow

```
styled (Panda output) → primitives → @reference-ui/react (packaged)
```

Primitives use `styled[tag]`, `box.raw()`, and recipe classes. The packager bundles these into the react package, with `@reference-ui/styled` imports rewritten to the user's generated styled output.
