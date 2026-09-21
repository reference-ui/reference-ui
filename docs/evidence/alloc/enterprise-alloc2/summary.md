# Allocation report: enterprise (latest)

Load: 3000 style files + 12000 dead, 7527 css() calls,
120 recipes, seed 7 (frozen app plan, no overrides).
Procedure: `agentrs-alloc/2` — same-run phase boundaries on GC + trace legs; span read against the trace run's own compile phase (v1 had post-import syncMs plus another run's span). GC leg profiles the shipped release `.node`;
the trace leg profiles the release+alloc-trace instrument build. Worker verbatim both legs.

## Worker samples per leg

| leg | syncMs | rssBefore | rssPeak | rssAfter |
| --- | --- | --- | --- | --- |
| gc (shipped) | 1194.7 | 95.6 MiB | 347.6 MiB | 325.6 MiB |
| trace (instrument) | 1450.6 | 96.6 MiB | 339.6 MiB | 317.6 MiB |

## Same-run phases (agentrs-phases/1)

One phases file per worker run; each leg reconciles internally. The GC
placements below still use the spawn-epoch bound (unchanged semantics) —
the phases add the per-stage wall the verdict never had.

| phase | gc-leg ms | trace-leg ms |
| --- | --- | --- |
| startup | 101.2 | 99.9 |
| config | 19.3 | 18.5 |
| scan | 358.9 | 353.3 |
| evaluate | 5.6 | 5.6 |
| compile | 762.6 | 1024.4 |
| publish | 48.2 | 46.8 |
| syncResidual | 0.0 | 2.0 |
| workerTail | 0.0 | 0.0 |
| syncTotal | 1194.6 | 1450.6 |

GC leg: RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker).
Trace leg: RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker).
Compile vs span (same run): compile 1024.4 ms, span 994.2 ms, delta 30.2 ms (N-API + JSON marshal outside the guard).

## R1 reproduction: GC census (`node --trace-gc`, shipped binary)

Events: 16 (Scavenge 14, Mark-Compact 2). First GC at 51 ms, last at 1270 ms.
V8 heap high-water: 51.7 MB before-GC, 37.0 MB after-GC.
R1 reference (Wave 4 hunter-r, enterprise): 12sc/0mc whole-run under both paths.
The whole-run count is the re-measurement; the verdict below places each full GC
against the measured compile window (trace leg), which is what R1 turns on.

## Handoff-window verdict (trace leg: span timestamps × same-process GC log)

PASS — zero in-window mark-sweep/mark-compact (1 head, 1 tail); R1's mechanism reproduced by measurement.

Window: 994.2 ms blocking call. Event times align to the window via the
spawn epoch (one-sided 60 ms spawn-latency bound; edge hits are ambiguous, never silent).

| tMs | kind | placement |
| --- | --- | --- |
| 99 | Mark-Compact | head |
| 1523 | Mark-Compact | tail |

## Rust side: reachable-live vs transient vs allocator-resident (compile span)

Blocking napi call: 994.2 ms. Transient: 938.6 MiB freed in-span
(8258147 blocks) of 946.6 MiB allocated (8259538 blocks, 1117428 reallocs).
Reachable-live (Rust): 13.9 MiB at span exit (5.9 MiB at enter,
net 8.1 MiB growth), 152.2 MiB span peak.

### Handed-off bytes (deterministic R1 ledger, measured in-span)

Files: 15122; contents 4.2 MiB + paths 1.2 MiB
+ request JSON 5.9 MiB = 11.3 MiB handed to the blocking call,
reachable-live on the JS side through the whole call.

### Allocator-resident (malloc default zone, whole process)

Zone at exit: 91.5 MiB reserved / 38.3 MiB in use /
53.2 MiB slack. Compile delta: 9.1 MiB reserved, 14.4 MiB in use.
Reserved counts whole region chunks claimed (never-faulted pages included), so it can
exceed RSS; the delta is the compile-attributable part. The zone covers malloc traffic
(Rust + Node C++); the V8 heap is mmap’d outside it, so the slack is the malloc-side story only.

### Span size classes (process cumulative alloc, live at span exit)

| class | alloc | blocks | live |
| --- | --- | --- | --- |
| <=32 B | 47.4 MiB | 5421025 | 0.0 MiB |
| <=128 B | 157.2 MiB | 2189014 | 0.0 MiB |
| <=512 B | 97.1 MiB | 501116 | 0.0 MiB |
| <=2048 B | 96.0 MiB | 115819 | 0.0 MiB |
| <=8192 B | 44.0 MiB | 13075 | 0.0 MiB |
| <=32768 B | 301.7 MiB | 19036 | 0.0 MiB |
| <=131072 B | 28.4 MiB | 451 | 0.0 MiB |
| >128 KiB | 180.8 MiB | 128 | 13.9 MiB |

## Scored-peak decomposition (enterprise RSS, legs cross-read)

Scored peak (GC leg, shipped): 347.6 MiB; after sync: 325.6 MiB (post-sync cliff 22.0 MiB).
Sync-added RSS (peak − before): 252.0 MiB; the Rust span peak (152.2 MiB) is ~60% of it (cross-leg, cross-run read).
V8 heap high-water: ~52 MB (mmap’d, outside the malloc zone).
Rust reachable-live at compile exit: 13.9 MiB (trace leg).
Malloc zone slack at compile exit: 53.2 MiB.
The legs agree with R1: with no full GC in the window, nulled old-space bytes
cannot leave RSS before the scored peak — the gap above reachable-live is
GC-timing/allocator-resident, not live data.

## Artifacts (which binary is which)

| build | profile | sha256 | builtVia |
| --- | --- | --- | --- |
| shipped | release | `5ac6c07e9f8d…` | napi build --release via ensure-native |
| trace | release+alloc-trace | `92deddbdaca3…` | napi build --release --features alloc-trace |

Shipped: `packages/reference-rs/dist/native/virtual-native.darwin-x64.node`. Trace: `packages/reference-rs/dist/native-trace/a33f89c47dea/virtual-native.darwin-x64.node`
(inputs a33f89c47dea; dist/native never touched).
