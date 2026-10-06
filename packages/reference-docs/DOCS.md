# Docs Stack Notes

## Stack

- Vite for build/dev
- React for rendering
- TanStack Router for app routing
- MDX (`@mdx-js/rollup`) for content
- `@content-collections/core` for validated doc metadata
- `rehype-pretty-code` + `shiki` for build-time syntax highlighting

No docs framework, and no client-side code playground. Reference UI compiles
its CSS at build time, so examples render the real shipped output and their
source is shown as a static, highlighted fenced block.

## Content model

- Docs live in `src/content/docs/**/*.mdx`. Only `.mdx` is collected; other
  extensions are ignored.
- Frontmatter contract: `title`, `section`, `order`, `slug`.
- `src/collections/` owns schema, transforms, and slug-to-module lookup.
- Vite owns MDX module loading; content-collections owns metadata only.

## Principles

- Content-first. The app shell stays thin and boring.
- Keep examples honest: render real components with real styles.
- Add tooling only when it solves a problem we actually have.

## Deliberately not adopted

- A full docs framework (Gatsby / Astro presets / Docusaurus / Next-first).
- Client-side transpile-and-run editors (react-live, Sandpack, etc.).
- Search. Revisit `pagefind` only when the sidebar outgrows itself.
