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
gates that fail the file. Neo takes the lib shape, not the rs shape:
cases and snapshots, executed in a real browser. No goldens, no
`--update-goldens`.

`pnpm agentneo`. Darwin QoS like the others. A CPU-gate class that can sit
next to `ct` / `rs` / `pw` without colliding. No matrix slots.

### What a test is

A case: a leaf folder under `tests/cases/` with a `case.json` id, a
`README.md` description, a small world source tree, and Playwright specs
asserting an outcome against that world — the CSS is valid, it wins in
the cascade, theme and variants paint. Static checks plus computed-style
assertions plus settled snapshots where rendering matters.

The CLI is the distillation layer agents call:

```text
pnpm agentneo list              # id, name, folder, README line
pnpm agentneo search <query>    # over id, name, README
pnpm agentneo run [case-id]     # serve the world, run headless, print artifacts
pnpm agentneo q [paths...]      # structural quality gate (it fails)
```

One React (19). One fast bundler path. Headless by default, artifacts
under the workspace, snapshots human-gated exactly like `agentct`.
Not webpack5. Not React 17. Those are matrix problems for the day Neo
is the installed core.

Unit tests sit next to the code they cover in `src/`. Cases are not
matrix packages. They do not install from Verdaccio.

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

Controls, then host. The quality gate (`agentneo q`: Neo's own Biome
config, measured thresholds as errors, the suppression ban, `any`
banned) plus the harness skeleton (`list` / `search` / `run`) plus one
committed smoke case (`NEO-SMOKE-01`: grey page, crimson dot,
computed-style assertions). No fragments yet. No packager. No `ref`
binary. The gate runs on everything we write from here on.

The map is the architecture. This file is the stance. The harness is the
product until the host has somewhere to live.

## Working docs

- [`PLAN.md`](PLAN.md) — the one living plan (the captain's log):
  Voyage One record, Voyage Two charter, decisions, gates, case catalog.
- [`docs/archive/`](docs/archive/) — landed Voyage One plan parts
  (harness, host seed/build spec, old index). History, not orders.
- [`docs/evidence/`](docs/evidence/) — the probe reports the campaign
  was planned from. Start at its README; cite, do not re-probe.
- [`docs/TESTING.md`](docs/TESTING.md) — how testing works: commands,
  case anatomy, artifacts, snapshots, quality gate.
- [`docs/DOMAIN.md`](docs/DOMAIN.md) — the living domain language:
  the names that build the runtime, plus retired ones to never revive.
