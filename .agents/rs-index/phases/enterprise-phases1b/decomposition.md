# Reconciled sync decomposition: enterprise (agentrs-phases/1)

Load: 3000 style files + 12000 dead, 7527 css() calls,
120 recipes, seed 7 (frozen app plan, no overrides).
Canonical run: flame leg (shipped .node, whole worker, procedure `agentrs-flame/3`).

| bundle | procedure | captured |
| --- | --- | --- |
| flame | `agentrs-flame/3` | 2026-09-21T11:40:40.366Z |
| counters | `agentrs-counters/3` | 2026-09-21T11:53:31.012Z |
| alloc | `agentrs-alloc/3` | 2026-09-21T12:37:06.079Z |

## The decomposition (canonical: flame run)

```
sync ≈ 1230.1 ms = config 30.6 + scan 364.3 + evaluate 6.2 + compile 780.3 + publish 48.7 (+ residual 0.0)
startup 118.1 ms sits outside sync (fresh-process cost); worker total 1348.2 ms.
```

Each column below reconciles within its own run; the spread column shows
how far the five runs disagree per phase (all five run the same frozen load).
Spread mixes wall jitter with instrument overhead (sampling, shim, alloc
counting); per-column reconciliation is the exact claim, spread is context.

| phase | flame | span | census | gc | trace | spread |
| --- | --- | --- | --- | --- | --- | --- |
| startup | 118.1 | 84.1 | 83.9 | 105.4 | 100.2 | 34.1 |
| config | 30.6 | 18.9 | 21.3 | 19.4 | 18.5 | 12.1 |
| scan | 364.3 | 353.2 | 360.2 | 356.9 | 355.7 | 11.1 |
| evaluate | 6.2 | 5.7 | 5.6 | 2.4 | 5.6 | 3.8 |
| compile | 780.3 | 768.4 | 759.2 | 758.4 | 1024.5 | 266.1 |
| publish | 48.7 | 47.5 | 49.6 | 48.5 | 48.2 | 2.1 |
| syncResidual | 0.0 | 0.0 | 1.9 | 0.0 | 2.1 | 2.1 |
| workerTail | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| syncTotal | 1230.1 | 1193.8 | 1197.8 | 1185.7 | 1454.7 | 269.0 |
| workerTotal | 1348.2 | 1277.9 | 1281.8 | 1291.1 | 1554.9 | 277.0 |

## Per-phase instrument reads (canonical ms, same-run buckets)

| phase | ms | share | flame wt | census calls | census ms | top census call |
| --- | --- | --- | --- | --- | --- | --- |
| startup | 118.1 | — | 118 | 1,551 | 5.9 | open |
| config | 30.6 | 2.5% | 25 | 132 | 0.6 | open |
| scan | 364.3 | 29.6% | 365 | 60,858 | 269.1 | open |
| evaluate | 6.2 | 0.5% | 6 | 12 | 3.5 | read |
| compile | 780.3 | 63.4% | 778 | 3,758 | 9.0 | stat |
| publish | 48.7 | 4.0% | 49 | 898 | 10.4 | write |
| syncResidual | 0.0 | 0.0% | 0 | 19 | 0.1 | openat |
| preMain | — | — | 0 | 7 | 0.0 | — |
| postWorker | — | — | 8 | 366 | 3.5 | — |

Attribution rule: each sample/event counts fully in the phase containing
its start timestamp; durations crossing an edge stay with the starting phase.
Weight ≈ ms at the profile rate; census ms is libc time inside the phase.

## Compile under the lens (same-run instruments)

Compile phase (canonical): 780.3 ms.
Counters span (same run as the span-leg phases): 740.0 ms blocking, 9,538,524,032 instructions, IPC 2.36.
Alloc span (same run as the trace-leg phases): 995.7 ms blocking, 946.6 MiB allocated, 1,117,430 reallocs, 152.2 MiB span peak.
Marshal delta (compile phase − span, same run): 28.5 ms on the counters leg, 28.8 ms on the alloc leg — N-API + JSON marshal plus the await hop, real compile-phase cost outside the guard.
GC verdict (alloc bundle): PASS — 0 in-window full GCs (1 head, 1 tail, 0 edge).

## Caveat: JS self does not bound JS-reachable savings

Low JS self % does not bound savings from JS-driven native/fs work. The JS phases (config/scan/evaluate/publish) spend most of their wall inside the native compiler and libc file calls: per-phase wall says where the run went, the flame lib split and the libc census say what it did there. A small JS-self share is compatible with large JS-reachable savings — read the two together, never the self share alone.

## Checks (re-derived from bundle raws before joining)

- Load match: scale enterprise, seed 7, 7527 css() calls identical across all three bundles.
- Reconcile: 5/5 legs RECONCILED (worst phase-sum delta 0.000 ms).
- Flame buckets reproduced from profile.json.gz + phases.json: 8 rows + pre/post weights exact vs filed meta; weights sum to weightSum 1349.
- Census buckets reproduced from census-events.json + census-phases.json: 67601 events across 7 phases exact vs filed meta; 0 dropped.
- Census buckets proven against the schema-1 census.json: event sums equal schema-1 census.json on all 15 calls (count/ns/bytes).
- Alloc phases reproduced from gc/trace-phases.json: gc + trace phase tables exact vs filed meta.

## What changed vs recon §2

Before (mixed windows): whole-worker flame shares × post-import syncMs,
an empty-process-subtracted libc census, and a span from another run —
per-stage milliseconds that never shared a clock.
After (this file): every stage measured inside one run on common edges,
startup included instead of subtracted, and the compile-phase marshal
delta (phase − span) visible for the first time.

## Reproduction

```bash
pnpm agentrs flame -- enterprise --out <flameDir>
pnpm agentrs counters -- enterprise --out <countersDir>
pnpm agentrs alloc -- enterprise --out <allocDir>
pnpm agentrs decompose --flame <flameDir> --counters <countersDir> --alloc <allocDir> [--out dir]
```
