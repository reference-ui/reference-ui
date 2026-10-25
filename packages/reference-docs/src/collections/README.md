# Collections

This directory owns docs content wiring for the package: schema, config, and
slug lookup. File headers describe each module.

The config entrypoint module is thin and lives here instead of the package root on purpose: the watcher subscribes to the config file's own directory, so a root-level entry would watch the entire package (including build output) and exhaust file descriptors (`EMFILE: too many open files, watch`). The `sync` script's one-shot `content-collections build` passes `--config` and the Vite plugin passes `configPath` to point at this file. Keep it thin and put actual collection logic here.

In dev the Vite plugin is the only writer of `.content-collections/generated`: it builds on start and watches while the server runs. A second watcher (the `content-collections watch` CLI) would write the same files concurrently, and a burst of MDX changes could leave `allDocs.js` truncated (ending in `]]`) so the app went blank. The `dev` script therefore runs `sync` once, then Vite and `ref sync --watch`; it never starts the CLI watcher.

This split is intentional:

- content-collections owns metadata validation and indexing
- Vite still owns MDX module loading
- the docs app keeps its existing MDX theme and React component imports