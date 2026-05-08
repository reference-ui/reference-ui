# Playwright Templates

This folder contains the Liquid templates used by the managed matrix Playwright module.

- `playwright.config.ts.liquid` renders the shared `playwright.config.ts` contract for matrix fixtures and generated consumers.
  It expands the active bundler set into Playwright projects and matching dev-server blocks.