# Docs quality gate

Lint, types, hygiene, and MDX checks over the docs sources.

It walks the docs paths and runs two linter passes (one failing, one loud), a strict typecheck, a banned-suppression scan, a file-length tier, the MDX tier, and the collection check. The tiers run side by side. Each finding prints as one greppable line, `error <file>:<line> <rule> <message>`, and the exit code is nonzero when any error is found.

## MDX tier

Every `.mdx` page under `src/content`, or the pages named on the command line, is checked for:

- `docs/mdx-compile`: the page compiles with the app's own plugin list, the options `src/mdx/pipeline.ts` gives the Vite config. The same compile captures each page's heading ids and link targets, using the id rules the heading components use.
- `docs/frontmatter`: the frontmatter parses as flat `key: value` lines (a colon followed by a space needs quotes), and the contract holds. `title`, `section`, `slug` and `description` are non-empty strings, and `order` is a number.
- `docs/slug`: each page's slug is unique across the docs collection.
- `docs/dash`: no em dash (U+2014) in prose. Fenced code, inline code and the frontmatter are exempt, and so is a table cell that holds only the dash, which marks an empty value.
- `docs/link` and `docs/anchor`: a `/page` link must name an existing page slug (`/` is the index page), and a `#heading` must name a heading id on the page it points to. External and relative links are not checked.

Pages compile on up to four worker threads, so the whole MDX pass over the docs takes about two seconds. Node must have built-in TypeScript type stripping to load `src/mdx/pipeline.ts`; without it the gate reports the tool as missing and exits 2.

## Collection check

Every `.mdx` page under `src/content` must be listed in the built docs collection (`src/collections/.content-collections/generated`). content-collections drops a page whose frontmatter does not parse and prints nothing for it, so the built output is the only place that drop shows. `docs/collection` names each page the output leaves out. When the output is missing or unreadable, the finding says to run sync. The check runs on every invocation, with or without path arguments. `sync` fails on the same drop, naming the page, because `src/collections/docs.ts` checks the build's documents.

Unit tests run with `pnpm --filter @reference-ui/reference-docs run quality:test`.

Unit tests run with `pnpm --filter @reference-ui/reference-docs run quality:test`.
