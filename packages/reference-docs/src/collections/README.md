# Collections

This directory owns docs content wiring for the package.

- `docs.ts` defines the typed docs collection schema and transforms.
- `index.ts` exports the content-collections config used by the generator.
- `runtime.ts` adapts generated metadata to the current Vite MDX runtime.

`content-collections.ts` is the thin config entrypoint. It lives here instead of the package root on purpose: the watcher subscribes to the config file's own directory, so a root-level entry would watch the entire package (including `dist/` output) and exhaust file descriptors (`EMFILE: too many open files, watch`). The CLI scripts pass `--config` and the Vite plugin passes `configPath` to point at this file. Keep it thin and put actual collection logic here.

This split is intentional:

- content-collections owns metadata validation and indexing
- Vite still owns MDX module loading
- the docs app keeps its existing MDX theme and React component imports