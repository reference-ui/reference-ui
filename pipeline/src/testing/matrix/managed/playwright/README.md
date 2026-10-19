# Managed Matrix Playwright

Shared Playwright config shape for standard matrix fixtures and generated consumers: one project plus dev-server block per active bundler. The `@playwright/test` pin lives in `pipeline/dependencies.ts`; the fixture generator writes it into packages that declare the runner, the Dagger runner falls back to it when a pin is missing, and the container image tag derives from it so package and browsers stay in lockstep.

Fixture-specific configs still live in `matrix/*` when a fixture tests a non-shared surface; `@matrix/playwright` keeps its own config because it validates the dedicated Playwright package contract rather than the shared bundler matrix.

Parent: [managed/README.md](../README.md).
