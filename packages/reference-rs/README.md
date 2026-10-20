# @reference-ui/rust

High-performance Rust compiler and native runtime tooling for Reference UI. Ships a single **Node-API (N-API) native addon** built with **[napi-rs](https://github.com/napi-rs/napi-rs)**, orchestrated via a shared runtime loader and typed TypeScript sibling modules.

The sole `cdylib` (`reference-native`) and its JS loader live in the runtime crate; shared Rust helpers live in the shared crate. Interactive map: `map.html`.

## Atomic style engine

TypeScript above the cut, Rust below. Authors write real TypeScript with imports and computed values; fragments collect the build-time calls (`tokens()`, `font()`, `keyframes()`, `globalCss()`) in JavaScript and hand Rust the dump. Rust consumes the dump — it never evaluates author files, and there is no native fragment evaluator.

Sibling crates, each with its own README and self-verification (`pnpm agentrs c <crate>`):

- **canon** — the language: tags, CSS properties, aliases, conditions.
- **base-system** — the definition: one system's tokens, fonts, keyframes, globals, recipes.
- **atomic** — the stylesheet compiler: extract → atoms → stylesheet + class map.
- **typegen** — the declaration printer: token unions, recipe variants, `StyleProps`.
- **styletrace** — the wrapper tracer: which components still carry StyleProps.

The engine emits two things: `styles.css` (layered `reset, global, base, tokens, recipes, utilities`) and types (token unions, `StyleProps`, recipe variants, font registry). Other products in this package (`tasty`, `atlas`) are not this engine.

JS face for the compiler: `import { compile } from '@reference-ui/rust/atomic'`.

## Native loading and packing

The loader resolves the local `dist/native` build first, then the installed platform optional dependency. `REFERENCE_UI_NATIVE_PATH` overrides with one explicit file. `verify:native` (prepack) fails closed on a stale or unstamped binary, so a pack never ships a `.node` built from older sources. The published files pack the JS, the types, and `dist/native` only — never cargo scratch or platform-package staging.

## How It Is Bootstrapped

1. **Build the native addon** with exclusive concurrency lock:

   ```sh
   pnpm agentrs b
   ```

2. **Run tests across modules or workspace**:

   ```sh
   # Rust workspace unit tests:
   pnpm agentrs c

   # Per-module:
   pnpm agentrs c canon
   pnpm agentrs c atomic
   pnpm agentrs v atomic

   pnpm agentrs v tasty
   pnpm agentrs v atlas
   pnpm agentrs v styletrace

   # Full verification pipeline (build -> cargo -> vitest -> quality):
   pnpm agentrs t
   ```
