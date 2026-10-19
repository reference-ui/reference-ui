# Reference UI Matrix

Consumer-style proving ground for what local tests and a single environment
cannot cover: multi-package `extends`/`layers` topologies and the MCP tool
surface, each run across bundlers and React runtimes by the Dagger pipeline.

`fixtures/` holds the shared `@fixtures/*` packages the suites consume as
packed dependencies. `tests/chain/` holds the chain suites (T1–T18), each a
small app with a `ui.config.ts` topology and Playwright contract specs in
`tests/e2e`; T1–T3 and T16–T18 add node-side runtime suites in `tests/unit`.
`tests/mcp/` holds the MCP standard suite: 19 unit files, 12 against one
shared server, 6 booting isolated servers, 1 pure unit.

`CHAIN.md` and `CHAIN_RULES.md` define the chain model and policy;
`TEST_COVERAGE.md` is the coverage index. For local IDE readiness, run
`pnpm pipeline setup --sync` from the repo root: it installs workspace
dependencies and runs each matrix package's `sync` script (`ref sync`) so
generated packages and types are present.
