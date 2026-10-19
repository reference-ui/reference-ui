# deepsee — sync observability tooling

One-command burndown, RSS attribution, and bundle accounting over the locked
bench load. New files only; zero engine edits, zero bench edits.

## One command

```bash
node packages/reference-core/benchmark/deepsee/cli.ts all --scale enterprise
node packages/reference-core/benchmark/deepsee/cli.ts all --scale medium   # iteration
node packages/reference-core/benchmark/deepsee/cli.ts burndown --scale small
node packages/reference-core/benchmark/deepsee/cli.ts rss --scale medium
node packages/reference-core/benchmark/deepsee/cli.ts bundle --dir <synced .reference-ui>
```

`all` runs ONE sampled sync, then derives all three reports off that run.
Reports land in a `deepsee-work-*` tmp dir (printed at the end).

## How it works

The burndown replicates `sync()` step for step with exact timers per
phase, recording phase boundaries, the N-API payload census (per-field
JSON bytes of the full result), and an RSS timeline; its output is
byte-identical to a bench sync. One sync runs under macOS `sample`,
and leaf self-time samples on the main thread attribute to the
nearest phase-matching ancestor, so shared callees (alloc, memcpy,
fmt) credit their caller phase — idle frames excluded, unmatched
reported as `other`, never hidden. Sampled shares scale to sync wall
and cross-check against the exact phase timers.

RSS comes from parent-side polling (a true timeline across the
blocking native call) plus a retention model: measured baseline,
source texts, N-API payload, and a residual for arenas, AST, and
overhead, with shares labeled approximate. The bundle accountants
are byte-exact: CSS splits nested `@layer` blocks plus block
classes, runtime-data splits the export envelope plus
per-table/per-field bytes by re-serialization, and both residuals
must be zero.

## Reading the numbers

- Exact: stage walls, RSS peaks, disk bytes, payload bytes, shipped bytes.
- Sampled ≈: native internal phases (shares × sync wall).
- Modeled ≈: RSS retention shares (copy-count multipliers stated in-line).
