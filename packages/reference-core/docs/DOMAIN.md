# Core Domain Language

Living doc. The names that build up the runtime — not every
identifier, just the load-bearing ones. When a name changes, update
this file in the same pass.

## Current

- **case** — one leaf folder under `tests/cases/`: an id, a
  description, a world, specs asserting an outcome. The unit of Core
  verification.
- **world** — a case's little source tree, served over local HTTP
  during a run.
- **spec** — a Playwright assertion file against a world: static
  checks plus computed styles plus settled snapshots.
- **server** — the per-case static HTTP server (`tests/shared/`).
- **artifact** — run output kept under
  `tests/.artifacts/<case-id>/`: screenshot, accessibility snapshot,
  trace/video on failure.
- **gate** — the structural quality check (`agentcore q`). It fails.
- **run / list / search / q / report** — the `agentcore` verbs: list
  the catalog, find cases, execute, gate, show tuning data.
- **above / below the cut** — Core is TypeScript above (collect,
  publish, runtime); reference-rs is Rust below (atomic, typegen,
  styletrace).
- **collect** — the collection subsystem (`src/collect/`): scan,
  bundle, evaluate-once, merge. The collected units are called **fragments** (below).
- **fragments** — author call sites (`tokens()`, `font()`, …)
  evaluated once in Node. The collected units; the subsystem that
  collects them is **collect**.
- **EvaluatedSystemSpec** — the frozen wire format crossing the cut.
  Owned by `reference-rs/contracts`, never redefined.
- **publish** — writing `.reference-ui/{system,styled,react}` from
  Rust's output.
- **stage** — the nested dir (`.reference-ui/sync.stage`) one sync
  assembles into before committing. The live folder keeps serving
  while the stage builds; the commit moves it live file by file
  (identical bytes skipped, the rest atomic-renamed, stale entries
  deleted last), so watchers see one coherent refresh with no
  bundler plugin. A failed sync drops its stage and keeps the
  last-good folder.
- **packager** — the subsystem (`src/packager/`) that owns the
  generated package set as declarative definitions, the manifests,
  the externals policies, the assembly order, and the named
  postprocess passes. Sync calls one entry with the compile output;
  the legs execute the definitions.
- **ship-list** — what a packed system unit ships: its
  self-contained dist (runtime inlined, only host React edges
  external) plus the baseSystem pair. The fixture build configs
  import the externals policy from the packager; they never mirror
  it.
- **Core** — this runtime: TypeScript above the cut (fragments, publish,
  runtime), Rust below. The package is `@reference-ui/core`.
- **author surface** — the one entry behind the `@reference-ui/core`
  id (`src/index.ts`): config plus the collector calls, factories
  excluded. Bundlers alias the id here; tsconfig paths point
  typechecking at the same file, so every resolver agrees on what
  authors can import.
- **dist** — per-world build output (`world/dist/`, gitignored):
  transpiled app sources. The harness rebuilds it clean on every
  run; pages reference it, never `src/`.
- **data-layer / data-color-mode / data-variant** — the DOM
  attributes primitives stamp: system name, active color mode,
  variant. Core-owned names; sheets and primitives agree on them.
  `data-color-mode` is the single
  colour-mode attribute — `colorMode` prop in JSX, same concept on
  the DOM. `data-theme` is Toast chrome (lib), never Core colour
  mode; `data-panda-theme` stays retired.
- **stamp** — a `data-layer` attribute on an element, naming the
  system that renders it. Token values are scoped by stamps: each
  system's token rule declares on its own stamps and on its
  **extended systems'**.
- **extended systems** — the extends closure of a system: the
  composed systems whose fragments it evaluates, so whose public
  tokens its vocabulary carries (`extendedSystemNames`). A layered
  system is never one. On the compile request they ride as
  `extendedSystems`; the engine's token rule claims their stamps, so
  under `extends` the app's token values win inside their components.
  (atomic)
- **group** — one feature family under `tests/cases/`: `SPEC.md`,
  `TESTS.md`, leaf cases.
- **status words** — `open`, `in-progress`, `done`, `blocked-on-rs`,
  `approved-absence`, `retired`: the `TESTS.md` ledger states.
- **host** — a JSX name whose style props extract under the app's own
  system: primitives carry every tag, wrappers earn it by forwarding.
  Ownership follows the import to where it lands on disk, never the
  name: a tag whose import ends at a package that published a system
  (lib, icons, any package built on Reference UI) is **external** even
  when it spells a host. A workspace package the same sync compiles, or
  one that renders this project's generated `@reference-ui/react`, is
  the app's own. (styletrace, atomic)
- **external** — a tag that renders through another package's runtime,
  which mints its class under that package's system. Its style props
  resolve in the app's vocabulary and are backed under the systems the
  package renders through (its published `streams`) that the app
  composes, never under any other. When none is composed, sync warns
  `ATM-W-EXTERNAL-UNBACKED` at the tag, naming the package, its system
  and `<package>/baseSystem`. A tag from a package not built on
  Reference UI is not a Reference component: nothing backs it and
  nothing warns. (atomic)
- **traced** — discovered by StyleTrace inside `compile()`, per
  project, from the code — never declared. (styletrace)
- **configured** — names in the `jsxElements` config field. Only Core
  cases set it, and docs never ask users to: tracing and provenance
  decide ownership. A configured name admits a project or unbound tag,
  never a package import. (styletrace)
- **owned** — a declared prop a component destructures and does not
  forward. It counts as forwarded, and stops being owned, only when
  it reaches an element under the same prop name: `name={name}`, or a
  spread whose object literal still contains that name.
  `<Icon size={size} />` counts, because the name is the same.
  Everything else leaves it owned: reflecting it under another name
  (`data-size={size}`, `aria-*`, `w={size}`), and using it in children
  or conditions. StyleTrace computes it, and `traceDetailed` returns
  it as `owned`. A call site reads an owned prop as the component's
  own, never as a style prop. (styletrace)
- **jsxOwned** — the owned props as published: a map beside
  `jsxElements`, from component name to sorted, unique prop names
  (`{ Tile: ['size'] }`). Absent or empty means nothing is owned, and
  the key is omitted when empty. The shape goes by three names:
  `jsxOwned` on the base system and the compile spec, `tracedJsxOwned`
  on the compile result, `owned` in the jsx artifact
  (`jsx-elements.json`). It flows through `extends` and `layers`;
  roster names flow through `extends` only, and reach the engine as
  `upstreamHosts`, never as own hosts, so the engine knows a layered
  component's own props without that component becoming a host.
  (styletrace)
- **compiler namer** — the Rust request-to-class function, run at
  compile time over extracted wants. The oracle behind every naming
  gate. (namer)
- **runtime namer** — the JavaScript mirror `css()` runs over style
  props. One algorithm with the compiler namer, held equal by the
  differential gate. (namer)
- **namer tables** — the closed data both namers read, written by the
  compiler and never by hand. (namer)
- **lowering** — one table-shaped step a canonical prop runs before
  naming: longhand shape, value rewrite, emit, drop. (namer)
- **naming rules** — the closed list of every place the class is not
  `prefix_sanitize(authored)`. (namer)
- **rules version** — the integer bumped whenever a naming rule
  changes a class; tables and runtime namer must carry the same one.
  (namer)
- **namer golden** — a Rust-generated `input → output` file for one
  procedure or lexical function. The runtime namer reproduces it.
  (namer; an rs golden, not a Core proof)
- **benchmark** — the synthetic-load harness (`benchmark/`): seeded
  repos at named scales, one pinned report per revision with peak RSS,
  sync time, and bundle size. Never a case, never in a suite. (bench)
- **scale** — one named bench load (`small`, `medium`, `enterprise`,
  `churn`): a generator plus locked numeric knobs. Same seed, same
  bytes. (bench)
- **generator** — a bench repo assembler (`app`, `churn`): which
  templates, how many, which shard layout. `app` is product-shaped;
  `churn` is a uniqueness stress. (bench)
- **template** — one bench file-kind writer: tokens, config, component,
  recipe, dead util. Takes rng plus plan, emits static literals only.
  (bench)
- **pin** — the report folder one bench run resolves to, decided before
  generation from the tree ignoring `reports/`. (bench)
- **latest** — the dirty-tree pin (`reports/latest/`): the overwrite
  scratch pad for the refine loop, never a log entry. (bench)
- **differential** — the end-to-end gate: the runtime namer over every
  authored declaration of a compile equals the compiled plans, slot
  and className. (namer)
- **miss class** — the class `css()` constructs for a request the
  compiler never saw. It paints nothing and warns once in browser
  dev. Not a ghost: ghosts stay forbidden. (namer)

## Retired (do not revive)

- **panda-isms** — `data-panda-theme`, panda naming, panda seams.
  There is no panda in core: copies from the retired reference-core get renamed at the
  boundary, never carried across verbatim.
- **station** — the compiler-loop word (rs-shaped). Core tests cases,
  not stations.
- **goldens / --update-goldens** — rs proves compilers with goldens;
  Core proves CSS with cases and human-gated snapshots.
- **bubble** — cute and confusing. The thing is a server.
- **data-theme as colour mode** — retired: colour mode is `data-color-mode`. (`data-theme`
  survives only as Toast chrome in lib, which is not Core's.)
