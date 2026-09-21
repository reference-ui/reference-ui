---
name: benchmark
description: Agent-first runner for Neo sync benchmarks. Invokes pnpm bench:neo over seeded synthetic repos, reads the pinned machine JSON, and reports peak RSS, sync time, and bundle size per scale. Activate when asked how sync performs, how much memory it uses, or how big its output gets at any scale.
---

# Benchmark Runner (`benchmark`)

Use this skill whenever you need **numbers for Neo `sync()` under synthetic load**: peak memory, sync time, bundle size — from a tiny product to a large messy app.

`benchmark` is the **agent-first** face of `packages/reference-neo/benchmark/`. You invoke the CLI, read `result.json`, and report the numbers.

## Scope: benchmark module only

This skill covers running benchmarks and interpreting their output. It does **not** cover changing sync, the engine, or any component. If the numbers send you back to code:

- `packages/reference-neo` runtime work → `agent-neo` skill (`pnpm agentneo`)
- `packages/reference-rs` engine work → `agent-rs` skill (`pnpm agentrs`)

## Commands

```bash
pnpm bench:neo                        # default suite (small,medium,enterprise), one pinned report
pnpm bench:neo -- --scale small       # one rung only (comma-separated subsets ok)
pnpm bench:neo -- --scale churn       # opt-in uniqueness stress (not in the default suite)
pnpm bench:neo -- --scale medium --runs 1 --json   # agent probe: machine JSON to stdout
pnpm bench:neo -- --list              # show the named scales
```

`--json` prints the full run record (same object as `result.json`) to stdout after the human readout. Prefer it when you need numbers in-chat; read `result.json` from disk when you need to diff two runs.

## Output contract

Each invocation pins one folder under `packages/reference-neo/benchmark/reports/`:

- `reports/<hash>/` — clean tree, one folder per measured commit (re-runs overwrite)
- `reports/latest/` — dirty tree or no checkout, overwritten every run
- `result.json` — the machine record: `revision`, `scales[]`, each with `plan`, `generated`, per-run `samples[]`, and `bundle` bytes
- `report.md` — the human readout

The pin resolves before generation from the tree ignoring `reports/` itself. Hash pins are the committed log; `latest/` is scratch for the refine loop.

The big three per scale, always medians across runs unless you say otherwise:

- **peak RSS** — max resident set sampled inside the child around `sync()` alone
- **sync time** — wall time around `sync()`, generation excluded
- **bundle** — `styles.css` + `runtime-data.mjs` bytes, raw and gzip

Beside them, always cite the load that produced them: generator, style files, `css()` calls, recipes, tokens, seed. A number without its load is not a benchmark.

## Reading a run

- Same seed means same bytes: re-running an unchanged commit reproduces `cssCalls` and `totalBytes` exactly. If they drift, the code or the plan changed — say so.
- Every run syncs in a fresh child process, so RSS baselines start cold. Compare medians across runs, not single samples.
- To compare revisions, run the suite on each (or read two pinned `result.json` files) and diff scale by scale: RSS, sync ms, then bundle bytes. Report deltas as percentages with the absolute numbers beside them.
- `uniqueRatio` means "not a token" under both generators. Under `app` the one-offs collide through small pools (hundreds of distinct values); under `churn` each is freshly minted (tens of thousands). Never compare uniqueness-bomb numbers against app-curve numbers without saying which is which.

## Cost and policy

Approximate cost per run on a desktop machine (RSS peaks, wall time): small ~120 MiB / ~150ms, medium ~200 MiB / ~480ms, enterprise ~800 MiB / ~4s, churn ~1 GiB / ~6s. Defaults run small 3x, medium 3x, enterprise 1x; churn is opt-in.

- Bench is not a test: no `case.json`, no `*.test.ts`, never in any suite. Run it only by explicit command.
- Hash-pin reports are committed history: one folder per measured commit. Never write anything else into `reports/`, and never commit `latest/` as a log entry.
- Do not run the enterprise or churn scales casually in a tight loop — reach for `--scale medium --runs 1` while iterating, full suite for the final numbers.
