# reference-rs — module layout + per-product tests

This is the spec. Not a cosmetic `mv`. Execute in order. Do not pause for a second speculative plan.

**Orchestration (Antigravity):** the parent agent does Phase 0 (skills/runner) and the physical tree move. After the tree compiles, it **must** spin up **Gemini 3.8 High** sub-agents — **one per module** — to tailor that module’s test harness. Do not give one model all four products. Do not use env vars for goldens.

---

## Why

`packages/reference-core` is a mini-monorepo: `src/system`, `src/packager`, `src/lib`, `src/config` — one directory is one module.

`packages/reference-rs` is three taxonomies of the same names:

```
crates/tasty    js/tasty    tests/tasty
crates/atlas    js/atlas    tests/atlas
crates/system   js/system   tests/system
```

Plus one Vitest `tests/globalSetup.ts` that boots atlas + tasty + virtualfs whenever you want to compile a `Div`. That is the mess.

The crates are already three products. The **addon** stays one kitchen sink. The folders should feel like core.

---

## Constraints (do not violate)

- **One npm package:** `@reference-ui/rust`
- **One native addon** (`.node`). Do **not** publish `reference-tasty` / `reference-atlas` / `reference-system`.
- Public API stays subpath exports:

  ```ts
  import { compile } from '@reference-ui/rust/system'
  import { createTastyApi } from '@reference-ui/rust/tasty'
  import { analyze } from '@reference-ui/rust/atlas'
  ```

- `compile()` still returns `{ stylesheet, css, diagnostics }`. Canon is **not** a third artifact. Do not export tables.
- `js/system` stays Atlas-thin `compile()`. No `js/system/tables`.
- Follow `.agents/skills/agent-rs/SKILL.md`: 2–6 sentence file headers, no `#[allow]`, file limits, no `unwrap` in domain lookups.
- Do not start `pnpm dev:lib`. Do not commit unless asked.
- Canon SSOT stays JS ingest (`@webref/css`, `@webref/elements` + reference-core dialect). Do not take lightningcss/html5ever as spec.
- **No env flags for goldens.** CLI only: `--update-goldens`
- Do not copy tasty’s “rewrite `output/` on every Vitest boot” onto system.

---

## Target tree

This is the shape. A module is a directory: rust + js + tests + README.

```text
packages/reference-rs/                      @reference-ui/rust
│
├── Cargo.toml                              workspace members = folders below
├── package.json
├── PLAN.md                                 this file
│
├── native/                                 today’s crates/napi — the only cdylib
│   ├── Cargo.toml                          depends on tasty, atlas, system, styletrace, shared
│   └── src/
│       ├── lib.rs                          loader + capability ping
│       ├── tasty.rs                        #[napi] → tasty crate
│       ├── atlas.rs
│       ├── system.rs                       compile_system
│       └── styletrace.rs
│
├── runtime/                                today’s js/runtime + js/tools (loader, ensure-native, publish)
│   └── …                                   like core’s lib/ — not a product
│
├── shared/                                 oxc helpers (core’s lib/)
│   ├── Cargo.toml
│   └── src/
│
├── tasty/
│   ├── Cargo.toml
│   ├── src/                                rust
│   ├── js/                                 @reference-ui/rust/tasty
│   ├── tests/                              MOVE tests/tasty here — keep tasty’s harness
│   └── README.md                           architecture, never a filename table
│
├── atlas/
│   ├── Cargo.toml
│   ├── src/
│   ├── js/
│   ├── tests/
│   └── README.md
│
├── styletrace/
│   ├── Cargo.toml
│   ├── src/
│   ├── js/
│   ├── tests/
│   └── README.md
│
├── system/
│   ├── Cargo.toml
│   ├── src/                                compiler
│   │   ├── canon/                          GENERATED rust — crate::canon
│   │   ├── extract/ atom/ resolve/
│   │   ├── stylesheet/ runtime/ config/
│   │   └── lib.rs                          compile()
│   ├── js/                                 compile() only
│   ├── canon/                              JS source of the dictionary
│   │   ├── platform.ts                    @webref
│   │   ├── dialect.ts                     tags.ts + Panda/Reference overlay
│   │   ├── generate.ts                    emits src/canon/*.rs
│   │   └── README.md
│   ├── tests/                              system harness (see below)
│   └── README.md
│
└── virtualrs/                              relocate from crates/virtualrs if still needed
    ├── Cargo.toml                          do not expand
    ├── src/
    ├── tests/                              isolate; do not teach system this harness
    └── README.md
```

**Gone**

- `crates/` as a dump
- `js/` as a second dump of the same product names (loader lives in `runtime/` or `native/`)
- `tests/` as a third dump
- `tests/globalSetup.ts` that always runs atlas + tasty + virtualfs
- `packages/reference-rs/canon/` at package root — canon lives at `system/canon/`

**Still one `.node`.** `native/` is the switchboard (core’s `entry/` + workers), not a fourth product.

`git mv` existing crates. Do not copy-paste history away. Update `tsup.config.ts`, `js/tools/create-dts-entrypoints.mjs` (or their new homes), Cargo workspace members, loader paths.

---

## Where canon goes

**Inside `system`.** Not a fourth product. Tasty and atlas never import it. `compile()` does not return it.

Same move as `reference-core/src/system/primitives/generate/` next to `tags.ts`.

```text
system/canon/           JS ingest + generate (webref + dialect)
system/src/canon/       generated rust tables the passes read
```

Fail-closed join stays in `generate.ts`: dialect HTML ⊆ webref elements; canonical CSS ∈ webref or allowlist; native shorthands match webref longhands.

---

## Testing is per module (this is the point)

Do **not** hunt for one harness. They already differ; the old `tests/` folder just hid that.

| Module | What a test is | Outputs |
| --- | --- | --- |
| **tasty** | scan types, emit modules, assert API | `output/` regenerated on suite setup; `api.test.ts` is intent |
| **atlas** | analyze an app, named assertions | `api.test.ts` is the case; `analysis.json` is inspection |
| **system** | `compile()` contract | **spec + committed snapshot**; do **not** rewrite every run |
| **styletrace** | wrapper graph / StyleProps names | fixture in, names out |
| **native / runtime** | loader, exports exist | smoke only |
| **virtualrs** | rewrite semantics (while it lives) | its own rewrite fixtures — do not copy onto system |

Shared infrastructure only: `pnpm agentrs`, the `.node` loader, `cargo test` next to the rust. Like core’s `lib/`.

What you **do not** share: “every product is `input/app` + byte-equal CSS.” Tasty is not a CSS compiler. System is not a type projector.

---

## System harness (spec vs snapshot)

Today `tests/system/cases/` is **only** a camera (`cases.test.ts` byte-compares). The “should” tests are orphaned `cascade.test.ts` / `expressions.test.ts` with pasted TSX. Snapshots without intent can bless bugs via `--update-goldens`.

A **case** says what must be true. A **snapshot** is what `compile()` emitted last time. You need both, in the same folder.

```text
system/tests/
  helpers.ts
  fixtures.test.ts
  expressions.test.ts              data-driven hasWant matrix (Panda absorbed table)
                                   — do NOT make 200 fixture folders
  fixtures/
    nested_ternaries/
      input/app/src/App.tsx        human writes
      spec.ts                      both borderBottom leaves; no currentColor
      output/
        styles.css                 machine writes
        css.json                   REQUIRED ({} is a golden)
        diagnostics.json           REQUIRED ([] is a golden)
        wants.json                 REQUIRED if compile() returns wants
    shorthand_cascade/
    rhythm_fractions/
    responsive_arrays/
    pseudo_conditions/
    seed_contract/
```

Call them **fixtures** until `spec.ts` exists. “Cases” without spec is a lie.

### `--update-goldens` (CLI flag, not env)

```bash
pnpm agentrs v system
pnpm agentrs v system --update-goldens
```

- Default: `compileFixture(input/app)` and `expect(actual).toBe(readFile(output/*))` for **all** required artifacts. Missing file = **fail**, not skip.
- `--update-goldens`: write those files, **then still run `spec.ts`** so you cannot bless a snapshot that fails the invariant.
- After write, **read the CSS diff**. Spec is why the fixture exists. Snapshot is the camera.
- If `--update-goldens` is passed to tasty/atlas, **error** — that harness does not work this way.

Delete overlap:

- `canon.test.ts` that duplicates `src/canon` rust tests (keep at most a **thin** N-API seam)
- `runtime.test.ts` `classes['mt:2r'] ?? classes['marginTop:2r']` — goldens lock the key
- `differential.test.ts` silent-skip when staging CSS is missing — that is not Gate C. Real Panda diff later, or delete

Keep `expressions.test.ts` as a table. That is the extract matrix, not a fixture folder per ternary.

---

## Phase 0 — skills first (parent, before any `git mv`)

If you rearrange first, every command in this document will lie.

Change:

- `.agents/skills/agent-rs/SKILL.md`
- `.agents/skills/agent-rs/scripts/run.mjs`
- `AGENTS.md` §4 (Reference RS Workflow)
- `packages/reference-rs/vitest.config.ts` so module filters resolve

Required CLI (must work on **today’s** paths, then keep working after the move via **module names**, not hardcoded `crates/` or `tests/` prefixes):

```bash
pnpm agentrs v tasty
pnpm agentrs v atlas
pnpm agentrs v system
pnpm agentrs v styletrace
pnpm agentrs v                    # all products — NOT one globalSetup that regenerates tasty

pnpm agentrs c tasty
pnpm agentrs c atlas
pnpm agentrs c system
pnpm agentrs c styletrace

pnpm agentrs v system --update-goldens
```

Semantics:

- `pnpm agentrs v system` runs **only** system Vitest. Must **not** run tasty globalSetup, must **not** regenerate tasty/atlas `output/`.
- Parse `--update-goldens` in `run.mjs` **now** so it is never an env var.
- Update SKILL examples that say `pnpm agentrs v tests/system/...` to module form.
- Document: three products, three harnesses.

**Prove Phase 0:** `pnpm agentrs v system` does not touch tasty cases. Then move folders.

---

## Phase 1 — tree (parent)

`git mv` crates into the target tree. Wire Cargo, tsup, package exports, loader. `pnpm agentrs b` then `pnpm agentrs c` workspace.

Move `packages/reference-rs/canon/` → `system/canon/`. Point generate.ts at `system/src/canon/`. Update `package.json` `"canon"` script.

Relocate READMEs: `crates/system/README.md` → `system/README.md`. Each module README = architecture, **never** a directory table of filenames.

---

## Phase 2 — Gemini 3.8 High swarm (mandatory)

Parent does **not** personally redesign every harness.

Launch **Gemini 3.8 High** sub-agents in Antigravity, **one per module**. Independent modules in parallel.

Each sub-agent prompt must include:

- the module path after the move
- what a test **is** for that product
- what **output** means
- what must **not** be copied from another module
- proof commands: `pnpm agentrs v <module>` and `pnpm agentrs c <module>`

Swarm:

1. **Tasty tests** — relocate `tests/tasty` → `tasty/tests`; own Vitest setup; do not change the product contract; regenerating `output/` on setup is OK for tasty **only**
2. **Atlas tests** — same idea; `api.test.ts` stays the case
3. **Styletrace tests** — fixture in, names out
4. **System tests** — the design work above (spec + snapshot + `--update-goldens`). Most important sub-agent.
5. **virtualrs tests** (if the suite still exists) — keep isolated; do not teach system rewrite-output globalSetup

Parent integrates, then:

```bash
pnpm agentrs v tasty
pnpm agentrs v atlas
pnpm agentrs v system
pnpm agentrs v system --update-goldens    # system fixtures only; spec still runs
pnpm agentrs c system
pnpm agentrs c tasty
pnpm agentrs q <moved paths>
pnpm agentrs t
```

---

## Done when

- Opening `system/` finds the compiler, canon generator, JS `compile()`, and tests
- No hunting in `crates/` vs `js/` vs `tests/` for the same name
- `native/` is the only napi crate
- `pnpm agentrs v <module>` isolates that product
- `--update-goldens` is a CLI flag on system Vitest only
- System fixtures have `spec.ts` + all required `output/` artifacts
- One `.node`, three doors
- Sub-agents were actually **Gemini 3.8 High**, one per module’s tests

---

## Read first

- `packages/reference-core/src/lib/README.md` (module feeling)
- `packages/reference-rs/README.md`
- `packages/reference-rs/crates/napi/src/lib.rs`
- `packages/reference-rs/tests/globalSetup.ts`
- `packages/reference-rs/tests/system/cases.test.ts`
- `packages/reference-rs/tests/system/helpers.ts`
- `packages/reference-rs/canon/` (move under `system/canon/`)
- `.agents/skills/agent-rs/SKILL.md`
- `.agents/skills/agent-rs/scripts/run.mjs`

Then Phase 0 skills. Then the tree. Then Gemini 3.8 High, one module at a time.
