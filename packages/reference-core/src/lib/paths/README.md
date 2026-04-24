# paths

Path resolution helpers used across `reference-core`.

These functions answer questions like:

- where is `ui.config.ts`?
- what is the configured `outDir` on disk?
- where is the hidden temp area under the project or outDir?
- where is `outDir/virtual`?
- where is the `@reference-ui/core` package root?
- where is `dist/cli/...` for worker files?

## What it owns

- config file candidate resolution
- output directory path helpers
- hidden temp-directory path helpers
- workspace/package-root discovery
- dist/cli path derivation

## What it does not own

- reading or validating config contents
- creating directories
- worker execution
- bundling

These helpers are about turning known inputs into consistent absolute paths.
