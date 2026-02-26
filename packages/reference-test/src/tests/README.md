# Tests

Tests are **environment-agnostic**. They never know:

- Which bundler (vite, webpack, rollup) the project uses
- Which React version
- Which matrix combination they're running in

That knowledge lives in the **orchestrator** and **matrix** modules. The orchestrator generates projects per matrix entry and runs tests from within each project. The injected test simply runs the flow: sync → build → dev → assert.

The Runner auto-detects the bundler from the project (vite.config.ts, webpack.config.js, etc.) so the test doesn't need to pass environment info.
