# Playwright Matrix

This package is the smallest matrix fixture that proves the pipeline can:

- install a consumer
- run `ref sync`
- launch Playwright in the container

It is intentionally small so matrix runner changes can be validated without bundler-specific complexity.

Runner contract:

- tests live under `e2e/`
- the matrix runner selects `mcr.microsoft.com/playwright:v1.48.0-jammy` for this package
- the package pins `@playwright/test` to the same version so the image and runner stay aligned