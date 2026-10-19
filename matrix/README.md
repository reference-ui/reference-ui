# Reference UI Matrix

Consumer-style proving ground for what local tests and a single environment
cannot cover: multi-package `extends`/`layers` topologies and the MCP tool
surface, each run across bundlers and React runtimes by the Dagger pipeline.

The shared `@fixtures/*` packages are the packed dependencies the suites
consume. The chain suites (T1–T18) are each a small app with a UI-config
topology and Playwright contract specs; T1–T3 and T16–T18 add node-side
runtime suites. The MCP standard suite runs 19 unit files: 12 against one
shared server, 6 booting isolated servers, 1 pure unit.

The chain model, the chain policy, and the coverage index live in the
sibling docs. For local IDE readiness, run
`pnpm pipeline setup --sync` from the repo root: it installs workspace
dependencies and runs each matrix package's `sync` script (`ref sync`) so
generated packages and types are present.
