# Docs Stack Notes

## Stack

- Vite for build/dev
- React 19 for rendering (aligned with `@reference-ui/lib`)
- TanStack Router for app routing
- MDX (`@mdx-js/rollup`) for content, with `remark-gfm` for tables
- `@content-collections/core` for validated doc metadata
- `rehype-pretty-code` + `shiki` for build-time syntax highlighting

No docs framework, and no client-side code playground. Reference UI compiles
its CSS at build time, so examples render the real shipped output and their
source is shown as a static, highlighted fenced block.

## Look & feel

Flat and quiet, in the spirit of shadcn/ui:

- One grayscale ramp; separation comes from tone and rhythm, not rules. The
  one hue is `docsAccent` (blue), kept to code panels.
- No heading dividers — vertical space carries the typographic hierarchy.
- Page header: the H1 title, then the frontmatter `description` as a muted
  one-line lead. Any page with a `description` gets it.
- Tutorial steps use `<Step n={1}>Install the packages</Step>`: an h3 with the
  number in a small `sm`-radius badge on a muted fill. The id, `#` anchor and
  outline entry use the heading text without the number. Each step is the
  heading, one short sentence, then the code panel.
- `<InstallPrompt />` is the AI-agent install card: a label, a primary
  "Copy prompt" button and a disclosure (collapsed by default) that shows the
  prompt read-only. The prompt is the repo-root `INSTALL.md`, imported with
  `?raw` at build time; edit it there, not in a page. (`.md` files are not
  compiled as MDX; pages are `.mdx` only.)
- Code panels have a 1px `docsBorder` hairline on a fill one shade off the page
  (lighter than the page in dark mode) and an `md` radius. Highlighted lines
  (```` ```tsx {4,8-10} ````) are full-width rows tinted with the accent. A
  copy action sits top-right; a centered "View Code" reveal appears only when
  the source is tall and has no highlighted lines.
- `<Install packages="…" dev devPackages="…" />` renders npm / yarn / pnpm /
  bun tabs over the install command; the selected tab is underlined in the
  accent, and the choice is shared by every block and remembered.
- Live examples sit in a flat `Preview` frame; the outline is a right-hand
  (`>=1280px`) table of contents read back from the rendered headings.
- Border radii stay small (`md`/`sm`); avoid `full` except where a shape is
  genuinely circular.

## Content model

- Docs live in `src/content/docs/**/*.mdx`. Only `.mdx` is collected; other
  extensions are ignored.
- Frontmatter contract: `title`, `section`, `order` (a number), `slug`, and
  `description` (the page header's lead), plus optional `group` (a sub-section
  heading in the sidebar). The collection schema in `src/collections/docs.ts`
  and the docs gate both require the first five. Pages and groups interleave
  in `order`; a group sits where its lowest-order page would. Orders step by 10
  so new pages slot in.
- content-collections drops a page whose frontmatter does not parse, and says
  nothing about it. So `sync` fails when a page is missing from the built
  documents, naming it, and the gate's `docs/collection` check finds the same
  gap by building the collection itself.
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
