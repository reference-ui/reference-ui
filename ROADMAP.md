# Release Roadmap

---

## API Tables _(final hardening)_ [DONE]

Core table rendering and Tasty hardening are done. Remaining items before this is considered complete:

- [ ] Represent extended interfaces better — collapsed/expandable inherited members, clear visual hierarchy
- [ ] Test cases for extended interface rendering — cover flat, single-level extended, and multi-level extended shapes

---

## MCP Server _(final hardening)_ [DONE]

The MCP server is at final stages. Remaining items:

- [ ] Final hardening pass — edge cases, error paths, unexpected input handling
- [ ] Add 'how to test' integration tests — document and codify real usage flows so the server is verifiably correct end-to-end
- [ ] Confirm Rust module boundaries — ensure the generated server module is self-contained and does not bleed into Reference internals

---

---

## Tasty: dedup correctness [DONE]

Duplicate-symbol behavior is currently untested and could regress silently.

- [x] Add tests covering dedup behaviour for duplicate symbols across multiple scan roots

> **Note:** symlink hygiene (`node_modules/@reference-ui/*` pruning) currently lives in `@reference-ui/core`. Worth revisiting if it causes observable scan issues, but not a priority action item right now.

---

## 1st Class State & Change Detection [DONE]

The internal event bus / state machine currently relies on `console.log` for observability. This needs to be a proper, structured system.

- [ ] Replace `console.log`-based state observation with a typed event emitter or structured logger
- [ ] Define explicit state transitions on the machine — make illegal states unrepresentable
- [ ] Expose a debug/trace mode that can be toggled externally (env var or config flag)
- [ ] Add tests that assert on state transitions, not log output

---

## Reload when Tokens get updated [DONE]

- [ ] Detect when token files change during `ref sync --watch` and trigger a targeted reload
- [ ] Ensure reload does not cause a full HMR storm — only invalidate what depends on the changed tokens
- [ ] Write tests: token update → reload → correct new values visible in consumer

---

## Vite Integration [DONE]

**Goal:** One coherent client update per logical change — avoid HMR storms while `ref sync --watch` is still writing (Panda, packager, declarations).

- [ ] Implement a Vite plugin that buffers HMR notifications until a defined **ready** signal (e.g. sync completion event)
- [ ] Remove or formalise the `vite.config` alias stopgap in `reference-lib` — the plugin should own resolution
- [ ] Test: rapid successive writes should produce exactly one HMR notification, not N

---

## Webpack Integration [DONE]

- [x] Implement equivalent of the Vite plugin for Webpack's watch/HMR pipeline
- [x] Define a shared abstraction (if possible) so bundler-specific plugins share the buffering logic
- [x] Basic integration test with a Webpack fixture project

---

## Reduce all dependency on console messages for testing, relying instead on the session api that the bundlers use (ready etc) [DONE]
- [x] make sure all unit tests pass with debug: false in their ui.config
- [x] make suyre all e2e tests pawss with debug: false in their ui.config


## Beautify the Console
- [ ] Give nice status messgaes (minimal)
- [ ] Warn when a component references a token that does not exist in the resolved token set
- [ ] Warn on circular dependencies in the scan graph
- [ ] Error with a clear message when config is malformed (currently likely a raw exception)
- [ ] Audit other silent failure points and add structured diagnostics throughout the pipeline
- [ ] Centralise all user-facing messages — consistent format, severity levels, and actionable hints



## Release: CLI / reference-core

First-class public release of `reference-core` (CLI + scanner + pipeline) as a standalone consumable package.

- [ ] Agree on public API surface — what is exported, what is internal
- [ ] Semver tagging strategy — decide on 0.x vs 1.0 threshold and what constitutes a breaking change
- [ ] Set up npm publish pipeline — CI step that gates publish on passing tests
- [ ] Write a changelog / release notes for the initial cut
- [ ] Smoke test suite — minimal integration test that can run in CI against a real project fixture before publish
- [ ] Public-facing documentation — installation, basic usage, config reference
