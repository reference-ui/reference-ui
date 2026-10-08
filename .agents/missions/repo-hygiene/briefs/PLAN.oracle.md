# PLAN.oracle — repo hygiene cleanup (`reference-system`)

STATUS: DONE

## Your job

Review this cleanup plan for a large monorepo ("Reference UI", a design-system
compiler) before any of it is executed. We are not asking you to execute
anything. We want:

1. A verdict on the plan's **shape and safety** — what breaks, what seams exist.
2. The **exact set of references** that must be updated for each move/delete
   (we want to catch every dangling path before we move).
3. **Additional cleanup candidates** we may have missed (the tree is large).

Argue from the actual files at HEAD, not from this summary. Pin findings to
paths and line numbers. End with a verdict line.

## Repo facts

- Branch `reference-system`, working tree clean, 136 commits ahead of origin.
- Root `AGENTS.md` and `README.md` stay.
- `packages/reference-legacy/` is workspace-excluded
  (`pnpm-workspace.yaml` has `- '!packages/reference-legacy/**'`). 515 tracked
  files, 2.7 MB.
- `docs/evidence/` (219 files, 19 MB of perf traces) is referenced by the
  `agent-rs` skill scripts and several missions — **keep as-is**.

## The confirmed plan

Owner-confirmed dispositions:

**A. Root loose files (relocate into `docs/`, archive/delete the rest):**
- `THEMING.md` → `docs/THEMING.md`
- `DECISIONS.md` → `docs/MISSIONS/DECISIONS.md`
- `DIAGNOSTICS.md` → `docs/DIAGNOSTICS.md`
- `WANTS.md` → `docs/MISSIONS/WANTS.md`
- `FINALIZE.md` → `docs/FINALIZE.md` (live closeout ledger)
- `FONT_WEIGHT_FAMILY_FALLBACK.md` → `docs/bugs/FONT_WEIGHT_FAMILY_FALLBACK.md`
  (sibling `docs/bugs/FONT_WEIGHT_RESOLUTION.md` already exists)
- `BUNDLER_UNIFICATION.md` → `docs/archive/BUNDLER_UNIFICATION.md`
- `FINISH.md` → `docs/archive/FINISH.md` (self-declares superseded by FINALIZE)
- `LOG.md` → `docs/archive/LOG.md` (14-line stub)
- `review.md` → delete (transient worktree review)
- `sync-perf.html` → delete (one-off perf page)

**B. `packages/reference-lib/` package docs:**
- delete `AGENTS.md` and the 4 root PNGs (`after-escape-1.png`,
  `after-escape-2.png`, `all-open.png`, `layer2-closed.png`)
- move `TESTING.md` → `docs/lib/TESTING.md`
- move `OVERLAYS.md` → `docs/lib/OVERLAYS.md`
- keep `README.md`, `CHANGELOG.md`

**C. `matrix/` markdown (8 files):** keep `README.md` + `CHAIN.md`; fold or
relocate `CHAIN_REPORT.md` (308 lines), `CHAIN_RULES.md` (284),
`TEST_MIGRATION.md` (194), `TEST_COVERAGE.md` (129), `PROMPT.md` (98),
`COVERAGE_EXTRA.md` (12).

**D. `packages/reference-neo/`:** delete `PLAN.md` (owner-flagged). Assess its
`docs/{DOMAIN.md,SWITCH-READINESS.md,TESTING.md,archive/,evidence/}`.

**E. `packages/reference-legacy/`:** delete the entire package and repair all
references.

## Known reference hits (from our scan; verify and complete these)

- `reference-legacy` is referenced from: `pnpm-workspace.yaml`,
  `packages/reference-neo/PLAN.md`, `packages/reference-neo/README.md`,
  `packages/reference-neo/src/lib/symlink/README.md`, `BUNDLER_UNIFICATION.md`,
  `FINALIZE.md`, `docs/MISSIONS/LOG-2.md`, `docs/MISSIONS/OPERATION_TOKYO.md`,
  and several `.agents/missions/**` files.
- `packages/reference-neo/PLAN.md` is referenced from `.agents/skills/agent-neo/SKILL.md`,
  `docs/Architecture.md`, `docs/LANGUAGE/PUBLIC-API.MD`, `docs/MISSIONS/LOG-2.md`,
  `docs/MISSIONS/OPERATION_JETTISON.md`, `docs/archive/README.md`, and
  `packages/reference-neo/docs/evidence/**`.
- `reference-lib/TESTING.md` and `reference-lib/OVERLAYS.md` are referenced from
  `docs/FEATURES/LIB_BOOK.md`, `docs/FEATURES/NEO_DATA_THEME.md`,
  `packages/reference-lib/src/components/components.md`,
  `packages/reference-lib/src/components/prompt.md`.

## Questions

1. Does any proposed move/create break a build, script, skill, or test path we
   have not listed? Name each and the exact line to edit.
2. Is deleting `reference-legacy` truly inert (nothing imports it, no lockfile
   importer, no CI path)? Confirm and list every reference to repair.
3. For `matrix/` and `reference-neo/docs/`, which files are live vs historical?
   Recommend fold-into-README vs archive.
4. **Additional cleanup candidates** across the repo (loose files, committed
   artifacts, superseded docs, dead dirs, naming sprawl). Categorize SAFE /
   LIKELY / JUDGMENT with path + whether referenced.
5. Any cleanup that would leave the tree RED (failing `pnpm install`,
   `tsc`, or the Rust/Vitest suites) — call it out so we sequence it last.
