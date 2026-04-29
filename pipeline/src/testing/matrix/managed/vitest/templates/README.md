# Vitest Templates

This folder contains the Liquid templates used by the managed matrix Vitest module.

- `vitest.config.ts.liquid` renders the shared `vitest.config.ts` contract for standard matrix fixtures and generated consumers.
  It optionally includes a `globalSetup` entry for fixtures like `@matrix/mcp`.