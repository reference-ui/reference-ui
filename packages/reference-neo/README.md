# Reference Neo

> Neo is the TypeScript portion of the compiler. Everything above the
> cut — authors write real TypeScript, Neo turns it into a spec, Rust
> compiles it, a living system comes out. That is the whole job.

```text
authors ──▶ collect ──▶ spec ──▶ Rust ──▶ system
   tokens()    scan      Evaluated     Atomic     .reference-ui/
   font()      evaluate  SystemSpec    stylesheet  system·styled
   keyframes() merge                 + class map   react·types
   globalCss()
```

## What it is

The host side of the system vision. Authors write `tokens()`, `font()`,
`keyframes()`, `globalCss()`; Neo finds those call sites, evaluates
them once in Node, and produces the spec — the entire TypeScript
product of the build-time layer. Rust never runs author files. After
Rust returns the stylesheet and class map, Neo packages the generated
system the ecosystem imports. Fragments in, a spec across the cut, Rust
compiles, a system comes out.

## What it is not

Not a fork of the old core, and not its chassis: no thread pool, no
event bus, no worker manifests. Neo does not recreate the namer, does
not lower styles in TypeScript, and does not invent a second Atomic.
Compile is native and short; publish is assembly; that is a function,
not a pool.

## The loop

```text
sync ──▶ collect ──▶ compile(Rust) ──▶ package ──▶ links
          ▲                                         │
          └──────────── watch ─────────────────────┘
```

One command runs the pipeline; watch re-runs it on change. Cases prove
behavior (`pnpm agentneo run`), the quality gate reviews every file
(`pnpm agentneo q`). The harness is the product until the host has
somewhere to live.

## Neighbours

| Thing | Job |
| :--- | :--- |
| `reference-rs` | The engine below the cut. |
| `reference-legacy` | Frozen old core. Museum — read, never import. |
| `reference-lib` | Components. Proof a package can own a fast harness. |
| `matrix/*` | External boundaries: install, bundlers, chain. |

## Working docs

- [`PLAN.md`](PLAN.md) — the living plan and open questions.
- [`PLAN_TOKYO.md`](PLAN_TOKYO.md) — the architecture rethink, item by item.
- [`docs/TESTING.md`](docs/TESTING.md) — cases, artifacts, snapshots, the gate.
- [`docs/DOMAIN.md`](docs/DOMAIN.md) — the domain language: names that build
  the runtime, plus retired ones to never revive.

## Building the bin (build-once)

The shippable `neo` bin is compiled: `bin` and the `./runtime` export
point at `dist/` (see [`tools/README.md`](tools/README.md)), because
Node refuses to type-strip shipped `.ts` under `node_modules`. `dist/`
is gitignored, so build it once per checkout (and rebuild after editing
neo sources) before any installed-shim invocation:

```sh
cd packages/reference-neo && node tools/build-bin.mjs
```

Direct-source invocations (`node bin/neo.ts sync`, the `NEO-CLI-*`
specs, `bin/neo.test.ts`) need no build. `prepack` and `prepublishOnly`
build automatically for real publishes.
