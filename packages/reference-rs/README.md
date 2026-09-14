# @reference-ui/rust

High-performance Rust compiler and native runtime tooling for Reference UI. Ships a single **Node-API (N-API) native addon** built with **[napi-rs](https://github.com/napi-rs/napi-rs)**, orchestrated via a shared runtime loader and typed TypeScript modules under `modules/`.

The **atomic style engine** is a stack of sibling crates under `modules/` — TypeScript above the cut, Rust below. Written plan: [`docs/atomic.md`](./docs/atomic.md). Interactive map: [`modules/map.html`](./modules/map.html).

## Architecture & Responsibilities

| Subsystem | Location | Role |
| --- | --- | --- |
| **Native Addon** | `modules/runtime` | The sole `cdylib` crate (`reference-virtual-native`) compiling to `.node`. Thin switchboard exposing domain capabilities through `#[napi]` functions with zero business logic. |
| **Runtime Infrastructure** | `modules/runtime/js` | Shared TypeScript layer providing platform detection, addon binary loading (`loader.ts`), and JSON call bridging (`native.ts`). Not the browser `css()` / `recipe()` contract. |
| **Shared Rust Helpers** | `modules/shared` | Internal compiler utilities (Oxc parser helpers, span conversions, unquoting). |
| **Product Modules** | `modules/*` | Self-contained feature modules, each with a pure domain Rust crate, TypeScript API wrappers where needed, and tests. |

## Atomic style engine

Sibling crates. Each verifies itself with `pnpm agentrs c <crate>`.

| Module | What it is | Verify |
| --- | --- | --- |
| **canon** | The language: tags, CSS properties, `mt` / `r` / conditions. `@webref` + dialect. | `pnpm agentrs c canon` |
| **base-system** | The definition. Fragment dump from TypeScript. Tokens, fonts, keyframes, globals, recipes. | `pnpm agentrs c base_system` |
| **atomic** | Extract → atoms → stylesheet + class map. One namer. Was `modules/system`. | `pnpm agentrs c atomic` · `pnpm agentrs v atomic` |
| **typegen** | `.d.ts` unions from base-system + canon. Not a jsx farm. | `pnpm agentrs c typegen` |
| **styletrace** | Which JSX names still carry StyleProps. Atomic extract calls this. | `pnpm agentrs c styletrace` · `pnpm agentrs v styletrace` |

Other products in this package (`tasty`, `atlas`, `virtualrs`) are not this engine.

JS face for the compiler: `import { compile } from '@reference-ui/rust/atomic'`. Core's live wire is still `@reference-ui/rust/system` (same module).

## Layout

```text
packages/reference-rs/
├── Cargo.toml                              # Workspace manifest (members = modules/*)
├── package.json                            # Package exports and scripts
├── docs/atomic.md                          # Engine architecture (from the map)
│
├── modules/
│   ├── map.html                            # Interactive stack — hover to see rests-on
│   ├── runtime/                            # Sole cdylib + JS loader
│   ├── shared/                             # Shared Rust helpers
│   ├── canon/                              # Language dictionary (@webref + dialect)
│   ├── base-system/                        # Design-system definition (fragment dump)
│   ├── atomic/                             # Stylesheet compiler (was system)
│   ├── typegen/                            # Token unions / StyleProps .d.ts
│   ├── styletrace/                         # StyleProps names + wrapper graph
│   ├── tasty/                              # AST extraction, type contracts, emitters
│   ├── atlas/                              # Component and token usage analyzer
│   └── virtualrs/                          # Virtual module CSS/CVA rewrites
│
└── dist/                                   # All generated outputs (gitignored)
```

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
