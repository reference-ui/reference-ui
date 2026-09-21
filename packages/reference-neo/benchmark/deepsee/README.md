# deepsee — sync observability tooling (Wave 1, lane E)

One-command burndown, RSS attribution, and bundle accounting over the locked
bench load. New files only; zero engine edits, zero bench edits.

## One command

```bash
node packages/reference-neo/benchmark/deepsee/cli.ts all --scale enterprise
node packages/reference-neo/benchmark/deepsee/cli.ts all --scale medium   # iteration
node packages/reference-neo/benchmark/deepsee/cli.ts burndown --scale small
node packages/reference-neo/benchmark/deepsee/cli.ts rss --scale medium
node packages/reference-neo/benchmark/deepsee/cli.ts bundle --dir <synced .reference-ui>
```

`all` runs ONE sampled sync, then derives all three reports off that run.
Reports land in a `deepsee-work-*` tmp dir (printed at the end).

## How it works

- `worker-phases.ts` — phased sync worker. Replicates `sync()` step for step
  with exact timers (config, fragments.prepare, fragments.evaluate,
  native.compile, publish), records phase boundaries, the N-API payload census
  (per-field JSON bytes of the full 11-field result), and an RSS timeline.
  Output is byte-identical to a bench sync (verified by `cmp`).
- `sample-parse.ts` — parses macOS `sample` call-graph output. Leaf (self-time)
  samples on the main thread, each attributed to the nearest phase-matching
  ancestor (demangled Rust symbols), so shared callees (alloc, memcpy, fmt)
  credit their caller phase. Idle frames excluded; unmatched reported as
  `other`, never hidden. Validated: leaf sums equal the thread total.
- `burndown.ts` — generates the locked load, runs one sync under `sample`
  (1ms), scales sampled shares to sync wall. Cross-checks: Σ native sampled
  vs exact `native.compile`, sampled ts vs exact TS stages.
- `rss.ts` — parent-side `ps` polling (true timeline across the blocking
  native call) plus a retention model: baseline (measured), source texts
  (≈2× disk: RS + TS copies), N-API payload (≈2.5× JSON: string + parsed),
  residual (arenas / AST / constants / overhead). Shares labeled approximate.
- `bundle-css.ts`, `bundle-data.ts`, `bundle.ts` — byte-exact accountants.
  CSS splits nested `@layer` blocks (brace-matched) plus block classes;
  runtime-data splits the export envelope plus per-table/per-field JSON bytes
  by re-serialization (round-trip asserted). Both residuals must be zero.

## Reading the numbers

- Exact: stage walls, RSS peaks, disk bytes, payload bytes, shipped bytes.
- Sampled ≈: native internal phases (shares × sync wall).
- Modeled ≈: RSS retention shares (copy-count multipliers stated in-line).
