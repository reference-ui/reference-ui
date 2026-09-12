# Managed Matrix Playwright

This folder owns the shared Playwright config shape used by standard matrix fixtures and generated matrix consumers.

The `@playwright/test` pin and jammy image distro live in `pipeline/dependencies.ts` (`MANAGED_PLAYWRIGHT_VERSION`). The fixture generator writes that exact version into any matrix package that already declares the runner, and the Dagger runner falls back to the same constant when a pin is missing. The container image tag is derived from that version so the package and browsers stay in lockstep.

The config is pipeline-managed because the active bundler set can change per run.
Default runs narrow to one effective bundler, while full compatibility runs keep all configured bundlers.

## Scope

- emit Playwright projects, ports, and webServer commands for the active matrix bundlers
- keep the shared `tests/e2e` contract out of runner orchestration code

Fixture-specific Playwright configs can still exist in `matrix/*` when a fixture intentionally tests a non-shared integration surface.

The current exception is `@matrix/playwright`, which deliberately keeps its own source-owned Playwright config because that fixture validates the runner's dedicated Playwright package contract rather than the shared bundler matrix contract.

## Tests

- `pnpm --dir pipeline exec tsx --test src/testing/matrix/managed/playwright/index.test.ts`