# Collections

This directory owns docs content wiring for the package: schema, config, and
slug lookup. File headers describe each module.

The config entrypoint module is thin and lives here instead of the package root on purpose: the watcher subscribes to the config file's own directory, so a root-level entry would watch the entire package (including build output) and exhaust file descriptors (`EMFILE: too many open files, watch`). The CLI scripts pass `--config` and the Vite plugin passes `configPath` to point at this file. Keep it thin and put actual collection logic here.

This split is intentional:

- content-collections owns metadata validation and indexing
- Vite still owns MDX module loading
- the docs app keeps its existing MDX theme and React component imports