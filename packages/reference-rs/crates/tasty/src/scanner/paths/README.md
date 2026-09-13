# Path Helpers

This folder owns scanner-level path normalization and naming rules.

These helpers turn filesystem paths into stable `file_id`, `module_specifier`,
and package-name values so the scanner and later stages can talk about files
without carrying platform-specific path details around.

## Responsibilities

- normalize paths to Unix-style `file_id` strings
- strip TypeScript source and declaration suffixes
- derive module specifiers from workspace and package files
- derive package/library names from external file ids

## Boundaries

- `paths/` does not touch the filesystem
- `packages/` decides how imports resolve
- `workspace/` decides which files are reachable
