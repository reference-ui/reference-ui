---
name: agent-neo
description: Self-contained workflow for Neo, the runtime portion of reference-rs (TypeScript fragments, publish, and runtime above the cut): case-driven Playwright verification via pnpm agentneo plus its own strict Biome-based quality gate.
---

# Agent Neo

Neo agent. You work in `packages/reference-neo` (`@reference-ui/neo`) and nowhere else.

## 1. What Neo Is

Neo is the code word for the **runtime portion of reference-rs**: TypeScript
**above the cut** (fragments, publish, runtime), Rust **below the cut**.

- Authors write real TypeScript: `tokens()`, `font()`, `keyframes()`,
  `globalCss()`, `recipe()`. Neo evaluates fragments once in Node, produces
  an `EvaluatedSystemSpec`, hands it to Rust (`compile()` / typegen /
  styletrace), then publishes the generated packages.
- Neo is **not a fork of reference-core**. Core stays Panda-stable, keeps
  its folder and npm name, and keeps shipping. Neo never edits core.
- Wire format is frozen in `reference-rs/contracts/`. Do not mint a second
  `EvaluatedSystemSpec`. Do not lower styles in TypeScript; do not invent
  a second Atomic.

## 2. The Loop (Self-Contained)

Agent Neo is self-contained: it **never touches reference-lib**. Its loop is
**cases plus Playwright** in `packages/reference-neo/tests`, driven by one CLI:

```bash
pnpm agentneo list            # all cases: id, name, folder, README first line
pnpm agentneo search <query>  # find cases by id, name, or README text
pnpm agentneo run [case-id]   # run one case, or all cases when omitted
pnpm agentneo q [paths]       # quality gate (section 6)
```

- **No matrix, no Dagger in the inner loop.** One React, one fast bundler
  (Vite). Matrix install/bundler-chain proof is for the day Neo is the
  installed core — not today.
- **Stance:** `packages/reference-neo/README.md` (what Neo is and refuses).
- **Voyage plan:** `packages/reference-neo/docs/PLAN.md` (the map) plus
  `packages/reference-neo/docs/PLAN-harness.md` (Part One detail: gate,
  CLI, cases, skill).
- **Usage:** `packages/reference-neo/docs/TESTING.md` (how to run the harness).
- **Nomenclature:** `packages/reference-neo/docs/DOMAIN.md` (the naming
  authority — check before naming anything load-bearing).

## 3. Cases and the CLI

`pnpm agentneo` maps to `node packages/reference-neo/tests/shared/cli.ts`.
Subcommands: `list`, `search <query>`, `run [case-id]`, `q [paths]`.

- Case IDs look like `NEO-<GROUP>-<nn>` (e.g. `NEO-FRAG-01`) and are
  discovered via each case folder's `case.json`. Cases nest: any folder
  with a `case.json` is a case at any depth, and ids must be unique
  across groups. Never hardcode the roster; ask the CLI.
- `list` shows four columns: **id, name, folder, README first line**. Keep
  case README first lines sharp — they are the catalog.
- Every case folder has a `README.md`. That file is the **standard case
  description** and is **never a failure**: the gate never fails a case
  README for content, length, or shape.

## 4. Playwright Policy

- **Headless is the default.** Snapshots, screenshots, `evaluate`, console,
  and network capture are all identical headless. Do not ask for headed.
- **Headed only on explicit human request.** If the human asks to watch,
  run headed for that session; otherwise stay headless.
- The `AutomationControlled` / unsupported-flag banner is **cosmetic
  Playwright plumbing, never a fault**. Do not chase it, do not "fix" it,
  do not fail a case over it.
- `file://` is blocked: case worlds are **always served over local HTTP**.
  Never point Playwright at a `file://` URL.
- Artifacts (traces, screenshots, dumps) land **under the workspace**
  (case folder or shared artifacts dir), never in `/tmp` as the record.

## 5. Scope Discipline (Where Work Goes)

| You need | Use | Touches |
| --- | --- | --- |
| Rust, N-API, system compiler, anything in `packages/reference-rs` | `agent-rs` skill (`pnpm agentrs`) | `packages/reference-rs` |
| `@reference-ui/lib` look / feel / polish | `tweak-component` skill | `packages/reference-lib` |
| `@reference-ui/lib` component logic, CT, snapshots | `test-component` skill (`pnpm agentct`) | `packages/reference-lib` |
| Core, matrix, pipeline, bundler contracts | **test-core** (`pnpm agent`) | `packages/reference-core`, `matrix/*`, `pipeline/*` |
| Neo runtime work (this skill) | **agent-neo** (`pnpm agentneo`) | `packages/reference-neo` only |

Neo **touches none of those trees**. If a Neo task implies a Rust change,
hand that part to `agent-rs`. If it implies a lib change, hand it to
`tweak-component` / `test-component`. If it implies core or matrix work,
hand it to **test-core**.

## 6. Quality Gate

```bash
pnpm agentneo q            # gate over changed files / package
pnpm agentneo q [paths]    # gate over specific files or dirs
```

Run the gate after every generation or modification step.

- **Neo's OWN Biome config — never core's.** Core's warn-only posture is
  the anti-pattern this gate exists to kill. Neo fails loud.
- **Fail line (errors):** cyclomatic complexity **12**, cognitive
  complexity **20**, params **5**, function length **120**, file length
  **500**, nesting depth **4**.
- **Warn line (loud, non-failing):** 8 / 12 / 4 / 80 / 365 on the same
  metrics, in the same order. Warnings shout; they do not block.
- **Generated files are exempt from length** (`@generated` marker or
  `.gen.` infix). Everything else fails honest.
- **Suppressions are banned:** `biome-ignore` is `#[allow]` and is banned
  in any form, `@ts-ignore` is banned, bare `@ts-expect-error` is banned
  (`@ts-expect-error` only with a same-line justification of 10+ chars).
  Redesign the code; never silence the analyzer.
- **TYPE SAFETY NON-NEGOTIABLE:** `any` is strictly banned (Biome
  `noExplicitAny` as error), plus strict `tsc` over `.ts` files for type
  errors the linter cannot see. Type the seam or narrow the unknown — no
  escape hatches.
- **Import boundary:** imports from `reference-core` or `reference-lib`
  paths fail the gate. Neo copies solved code into Neo-owned modules;
  it never imports across.
- One thin extra check sits beside the linter (it is **not** the linter):
  every file carries a **2–6 sentence header** saying what it does, takes,
  and emits; READMEs describe architecture and carry **no filename tables**.
- `q --report` prints the **complexity distribution** (percentiles plus top
  offenders) for tuning — measured, not vibes.
- The gate must stay **fast** (seconds, not minutes). It is **structural
  only** — complexity, length, safety, headers. No formatting opinions.

## 7. Development Loop

1. Read the stance (`README.md`), the voyage plan (`docs/PLAN.md` plus
   `docs/PLAN-harness.md`), the usage doc (`docs/TESTING.md`), and the
   nomenclature authority (`docs/DOMAIN.md`).
2. Find your case: `pnpm agentneo list` / `search <query>`.
3. Implement in `packages/reference-neo` only.
4. Run the case: `pnpm agentneo run <NEO-...>` until it passes.
5. Run the gate: `pnpm agentneo q`. Fix the architecture on failure —
   never an allow, never an `any`, never a suppression.
6. Re-run the case after gate-driven refactors.
7. Review: the naming pass, then the beauty pass. Naming — check
   `docs/DOMAIN.md` FIRST, it is the nomenclature authority: best
   file/module name for this? confusable with anything else? specific
   enough? Beauty — good structure? readable flow? would a human
   reviewer call it beautiful? Refactor toward yes. Whenever the
   language evolves, update `docs/DOMAIN.md` in the same pass.

## 8. Retirement Clause

If the user ever says to change Neo into core — to promote or rename Neo
as the installed core — the code word **retires**: update this skill, the
`AGENTS.md` routing table, and the package names, and **stop saying Neo**.
