# Neo

Successor host for Reference UI. Not a fork of `reference-core`. Core stays
Panda-stable and keeps shipping. Neo is the TypeScript side of the system
vision already drawn in [`reference-rs/modules/map.html`](../reference-rs/modules/map.html):
fragments in, a spec across the cut, Rust compiles, a system comes out.

The first product is the test harness. The host is built against that harness,
not the other way around.

## What it is

Neo owns everything above the dotted line on the map.

Authors write real TypeScript: `tokens()`, `font()`, `keyframes()`,
`globalCss()`, `recipe()`. Neo finds those call sites, evaluates them once in
Node, and produces an `EvaluatedSystemSpec`. That dump is the whole TypeScript
product of the build-time layer. Rust does not run author files. A native
fragment evaluator is Panda v2 (OXC plus an interpreter, nested ternaries
folding to Null, ghost classes). Do not.

Then Neo hands the spec, the source root, and the jsx hosts to
`@reference-ui/rust`. Atomic emits the stylesheet and the class map. Typegen
emits the unions. Styletrace answers which JSX names still carry StyleProps.
Neo does not recreate the namer, does not lower styles in TypeScript, and
does not invent a second Atomic.

After Rust returns, Neo writes the generated packages the rest of the
ecosystem already knows: `.reference-ui/system`, `.reference-ui/styled`,
`.reference-ui/react`, linked as `@reference-ui/system` and friends. The
published names do not change. Neo is the machine that produces them.

The runtime layer sits in Neo too: authored `css()` and `recipe()` that
read the maps Rust already named. Primitives sit on that runtime. They are
not an output of atomic.

Wire format is already frozen in [`reference-rs/contracts/`](../reference-rs/contracts/).
Do not mint a second `EvaluatedSystemSpec`.

## What it is not

- Not a rename of core. Core keeps its folder, its npm name, and `ref`.
- Not `@reference-ui/system`. That is the generated package apps import.
- Not the compiler. Atomic, typegen, canon, styletrace, base-system stay in
  `reference-rs`.
- Not the matrix. Bundlers, React 17/18, Verdaccio, Dagger, and the
  `extends`/`layers` chain stay downstream, for later, for when Neo is
  actually a host other packages install.
- Not a thread-pool opera. Core needed workers because Panda, packaging,
  virtual copy, and type generation all fought over the same Node process.
  Neo's inner loop is serial on purpose: fragments always first, then one
  native compile, then publish. Rust is the fast part. Do not start a
  Piscina pool to hide a synchronous pipeline.

## The loop

```text
author TS
  → fragments (evaluate once, in Node)
  → EvaluatedSystemSpec
  → compile() / typegen / styletrace
  → stylesheet + runtime maps + .d.ts
  → .reference-ui/{system,styled,react}
```

That is the whole host at v0. Watch, Vite plugins, MCP, Book, and the
packager's more baroque edges are not the opening chapter. If a piece of
core exists only to coerce Panda output or to orchestrate six workers around
a compile that is now a function call, it does not come across.

## Harness

This is the work. Lib has `pnpm agentct`: one warm Vite, colocated unit,
Playwright CT, human-gated snapshots, one package, no Dagger. Rs has
`pnpm agentrs`: stations, committed goldens, standing gauges, quality
gates that fail the file. Neo needs the same grain for the host.

`pnpm agentneo`. Darwin QoS like the others. A CPU-gate class that can sit
next to `ct` / `rs` / `pw` without colliding. No matrix slots.

### What a test is

Two layers, in this order:

1. **Stations.** Input is a tiny authoring tree (fragments + a few TSX
   files). Output is the spec, the sheet, the class map, the generated
   package surface. Committed goldens. Opt-in `--update-goldens`. Standing
   gauges on every station: spec schema, six-layer preamble, no ghost
   classes, publish is atomic. This is the rs-shaped loop. It should be
   seconds. This is where agents live.
2. **Playwright, later, local, warm.** One React. One bundler, whichever is
   fastest to boot — Vite, because lib already proved that shape. Did the
   class actually win in the cascade. Did `data-theme` paint. Did a recipe
   variant apply. Not webpack5. Not React 17. Those are matrix problems
   for the day Neo is the installed core.

Unit tests sit next to the code they cover. Stations are not matrix
packages. They do not install from Verdaccio.

### What we refuse at v0

- Multi-React in the harness. Add it when Neo is a host, the way lib did,
  as an alias, not as a pipeline.
- Multi-bundler. Pick one fast path and keep it.
- Hermetic containers as the inner loop. Matrix exists. Use it for
  install and chain when there is something to install.

## Simplicity

Core grew a chassis around Panda: thread pool, event bus, worker
manifests, scheduler priorities, tsup worker entry maps, generated
`panda.config.ts`, PostCSS after the fact. Neo starts after that world.

Open on purpose:

- **TypeScript 7 from day one.** The workspace already types against 7.
  Neo does not carry a 5.x compile. Native preview / `tsgo` is in play;
  typecheck should be the fast path, not a ritual.
- **Do we need tsup?** Core has tsup *and* tsdown. The packager is a
  product decision, not a default. If the publishable surface is a handful
  of ESM files and some generated artefacts, a bundler may be optional.
  Decide when there is something to ship, not at the folder's birth.
- **Do we need workers?** Fragments must finish before compile. Compile is
  native and short. Publish is a rename. That is a function, not a pool.
  A watcher can be a later loop around the same function. If something
  genuinely parallel appears (copying a huge virtual tree while Rust
  runs), measure it. Do not copy Piscina because core had Piscina.
- **Quality gates like rs.** Small files, honest failure, no silenced
  lints, headers that say what the file takes and emits. The gate is the
  reviewer. A 857-file dump should not be able to land.

## Neighbours

| Thing | Job |
| :--- | :--- |
| `reference-core` | Production host today. Panda. Leave it alone. |
| `reference-rs` | The engine below the cut. |
| `reference-lib` | Components. Proof that a package can have its own fast harness. |
| `matrix/*` | External boundaries: install, bundlers, chain. Not Neo's daily loop. |
| generated `@reference-ui/system` | What apps import. Neo produces it. Neo is not named it. |

## First move

Harness CLI that can run a station and fail. One station: a `tokens()`
file in, a spec out, schema asserted. No Playwright yet. No packager.
No `ref` binary. Quality check on whatever we write.

The map is the architecture. This file is the stance. The harness is the
product until the host has somewhere to live.
