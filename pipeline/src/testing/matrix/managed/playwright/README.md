# Managed Matrix Playwright

This folder owns the shared Playwright config shape used by standard matrix fixtures and generated matrix consumers.

The config is pipeline-managed because the active bundler set can change per run.
Default runs narrow to one effective bundler, while full compatibility runs keep all configured bundlers.

## Scope

- emit Playwright projects for the active matrix bundlers
- emit matching dev-server commands and ports for each active bundler
- keep the shared `tests/e2e` contract out of runner orchestration code

Fixture-specific Playwright configs can still exist in `matrix/*` when a fixture intentionally tests a non-shared integration surface.

The current exception is `@matrix/playwright`, which deliberately keeps its own source-owned Playwright config because that fixture validates the runner's dedicated Playwright package contract rather than the shared bundler matrix contract.

## Tests

- `pnpm --dir pipeline exec tsx --test src/testing/matrix/managed/playwright/index.test.ts`