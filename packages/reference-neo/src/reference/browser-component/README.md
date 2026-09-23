# Browser Component Mirror

This directory is a mirrored component tree.

Source of truth:

- packages/reference-lib/src/components/Reference

These files are copied by:

- packages/reference-core/tools/copy-reference-api-component.mjs

In the monorepo this directory is gitignored; the package's `prepare` script runs
this copy after `pnpm install`, and `prebuild` runs it again before each build.

Do not edit files here directly. Edit the reference-lib source and re-run the copy script.
