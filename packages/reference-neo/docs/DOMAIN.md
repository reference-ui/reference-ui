# Neo Domain Language

Living doc. The names that build up the runtime — not every
identifier, just the load-bearing ones. When a name changes, update
this file in the same pass.

## Current

- **case** — one leaf folder under `tests/cases/`: an id, a
  description, a world, specs asserting an outcome. The unit of Neo
  verification.
- **world** — a case's little source tree, served over local HTTP
  during a run.
- **spec** — a Playwright assertion file against a world: static
  checks plus computed styles plus settled snapshots.
- **server** — the per-case static HTTP server (`tests/shared/`).
  (Renamed from "bubble" in r5.)
- **artifact** — run output kept under
  `tests/.artifacts/<case-id>/`: screenshot, accessibility snapshot,
  trace/video on failure.
- **gate** — the structural quality check (`agentneo q`). It fails.
- **run / list / search / q / report** — the `agentneo` verbs: list
  the catalog, find cases, execute, gate, show tuning data.
- **above / below the cut** — Neo is TypeScript above (fragments,
  publish, runtime); reference-rs is Rust below (atomic, typegen,
  styletrace).
- **fragments** — author call sites (`tokens()`, `font()`, …)
  evaluated once in Node.
- **EvaluatedSystemSpec** — the frozen wire format crossing the cut.
  Owned by `reference-rs/contracts`, never redefined.
- **publish** — writing `.reference-ui/{system,styled,react}` from
  Rust's output.
- **Neo** — the code word for this runtime rebuild. Retires if
  promoted to core.
- **author surface** — the one entry behind the `@reference-ui/neo`
  id (`src/author/`): config plus fragment collectors. Bundlers
  alias the id here; tsconfig paths point typechecking at the same
  file, so every resolver agrees on what authors can import.
- **dist** — per-world build output (`world/dist/`, gitignored):
  transpiled app sources. The harness rebuilds it clean on every
  run; pages reference it, never `src/`.
- **data-layer / data-color-mode / data-variant** — the DOM
  attributes primitives stamp: system name, active color mode,
  variant. Neo-owned names; sheets and primitives agree on them.
  D1 (human override 2026-09-17): `data-color-mode` is the single
  colour-mode attribute — `colorMode` prop in JSX, same concept on
  the DOM. `data-theme` is Toast chrome (lib), never Neo colour
  mode; `data-panda-theme` stays retired.
- **group** — one feature family under `tests/cases/`: `SPEC.md`,
  `TESTS.md`, leaf cases. (campaign)
- **slice** — one case (or a small bundle in one group) taken from
  engine check → host integration → browser proof. (campaign)
- **rung** — one slice step: `engine`, `host`, `proof`. (campaign)
- **station** — a cited Atomic case (`ATM-*`, Vitest golden). Neo
  cases cite stations; they never duplicate them. (campaign; Neo's
  own unit stays **case**)
- **evidence tag** — `[lib]`, `[panda-v1]`, `[atm]`, `[core]`,
  `[decision Dn]` on every case README. (campaign)
- **status words** — `open`, `in-progress`, `done`, `blocked-on-rs`,
  `approved-absence`, `retired`: the `TESTS.md` ledger states.
  (campaign)
- **roles** — captain, planner, scout, cartographer, line cook, RS
  liaison, oracle: the voyage crew. (campaign)

## Retired (do not revive)

- **panda-isms** — `data-panda-theme`, panda naming, panda seams.
  There is no panda in neo: copies from core get renamed at the
  boundary, never carried across verbatim.
- **station** — the compiler-loop word (rs-shaped). Neo tests cases,
  not stations. (In the campaign it narrowly means a cited `ATM-*`
  case — see Current.)
- **goldens / --update-goldens** — rs proves compilers with goldens;
  Neo proves CSS with cases and human-gated snapshots.
- **bubble** — cute and confusing. The thing is a server.
- **data-theme as colour mode** — retired by D1 (human override
  2026-09-17): colour mode is `data-color-mode`. (`data-theme`
  survives only as Toast chrome in lib, which is not Neo's.)
