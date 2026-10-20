# Managed Matrix Playwright

Shared Playwright config shape for standard matrix fixtures and generated consumers: one project plus dev-server block per active bundler. The `@playwright/test` pin lives in the pipeline dependency pins; the fixture generator writes it into packages that declare the runner, the Dagger runner falls back to it when a pin is missing, and the container image tag derives from it so package and browsers stay in lockstep.

Setup exempts `@matrix/playwright` from managed generation, so a fixture validating the dedicated Playwright package contract keeps its own config rather than the shared bundler matrix.
