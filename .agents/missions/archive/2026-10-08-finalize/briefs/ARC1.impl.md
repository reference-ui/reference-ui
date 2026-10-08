# Brief — ARC1.impl (crew: general, DeepSeek V4.1 Flash, `#high`)

You implement **Arc 1: memoize external resolution** in the tasty scanner.
Read `.agents/missions/finalize/MISSION.md` and `FINALIZATION_REPORT.md`
(repo root) first. Follow the **`agent-perf` skill** (`.agents/skills/agent-perf/SKILL.md`)
and the **`agent-rs` skill** (`.agents/skills/agent-rs/SKILL.md`).

Work in `/Users/ryn/Developer/reference-ui`, branch `reference-system`. Do
**not** commit, push, or `git stash`. Do not touch files another arc owns
(`packages/reference-neo/**`, `packages/reference-docs/**`). If `git status`
shows files you did not touch, disclose them — never absorb or revert them.

## Problem (measured)

On the docs repro `ref sync` one-shot spends ~11s in the tasty phase. Inside
it, for **19 distinct external specifiers** the scan makes:

| Counter | Value |
| --- | --- |
| `resolve_external_import` calls | 8,067 |
| `find_installed_declaration_provider` fallbacks | 7,922 |
| `read_package_json` reads | 242,578 |

Every fallback re-walks the disk with **zero memoization**.

## Seams (verify them; do not trust this list)

- `packages/reference-rs/modules/tasty/src/scanner/packages.rs`
  - `resolve_import` (:17) → external branch → `resolve_external_import` (:57)
    → `resolve_package_import_from_root(...).or_else(find_installed_declaration_provider)`
  - `resolve_external_import` is a **pure function of `(root_dir, source_module)`**
    — `root_dir` is constant per scan. That is the memo key, and the negative
    (`None`) outcome must be cached too.
- Callers of `resolve_import`: `ast/extract/module_bindings/imports.rs:45`,
  `.../exports.rs:137`, `ast/extract/statements/exports.rs:128`,
  `scanner/workspace/policy.rs:42`.
- Per-file context is `ExtractionContext` (`ast/extract/context.rs`) — it is
  **per file**, so it is not the place for a per-scan cache. A per-scan cache
  must be created at scan/extract entry (`scan_typescript_bundle` /
  `extract_ast` / `extract_files`) and threaded to the resolve sites.
- Expensive tail: `scanner/packages/package_entry.rs`
  `find_installed_declaration_provider` iterates `installed_package_dirs` and
  calls `scanner/packages/package_json.rs` `read_package_json` per package —
  with no cache. A per-specifier memo alone may leave ~19 × N reads; if the
  reads bar below is not met, add a second-level `read_package_json` memo
  keyed by absolute path. Prefer a small, documented resolver-state struct
  over loose args (agent-rs: no `#[allow]`, no parameter soup, context struct).

## Bar (from the report)

- Counters show **≤ ~19** `resolve_external_import` resolutions and **≤ ~19**
  `package.json` reads on the docs repro.
- One-shot `ref sync` on docs drops by ~11s.
- **Byte-identical output**: same inputs → same manifest bytes. Prove with the
  committed tasty goldens (`pnpm agentrs v tasty`) and 4-scale byte-identity
  per `agent-perf` where applicable; zero emission-order changes.
- `pnpm agentrs c tasty` and `pnpm agentrs v tasty` green; `pnpm agentrs t`
  green; `pnpm agentrs q` on every touched file → 0 violations.

## Method requirements

- Measure with **temporary** counters (e.g. `eprintln!`/atomic statics) to
  produce the before/after table, then **revert the instrumentation** before
  you finish. `grep` for `eprintln|dbg!|PROBE_` in your touched files must
  show no new hits (one pre-existing `eprintln!` at
  `modules/tasty/src/tests/extract.rs:433` is fine).
- Take the bench lock per the `agent-perf` protocol (`/tmp/swarm-bench-lock`)
  for any timed block; release in two steps; never time against a ghost lock.
- Sandbox the repro: `pnpm --filter @reference-ui/reference-docs exec ref sync`
  with the tasty dir removed for a cold run; watch mode for warm.
- Quality first, then Rust tests, then seam tests, then the full loop.
- Every fault you hit: record the exact command, workaround, and minutes lost
  in your report (agent-perf DX appendix).

## Output

Write `.agents/missions/finalize/reports/ARC1.impl.md` with: hypothesis, the
exact before/after counter table, files changed (exact paths), the identity
proof, suites run with results, `agentrs q` result, and a `VERDICT:
LAND | BANK | CUT | HOLD` line with mechanism proof. Append an entry to
`.agents/missions/finalize/ARC1.md`. Then reply with a short summary and the
verdict.
