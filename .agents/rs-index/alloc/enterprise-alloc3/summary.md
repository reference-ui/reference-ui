# Allocation report: enterprise (latest)

Load: 3000 style files + 12000 dead, 7527 css() calls,
120 recipes, seed 7 (frozen app plan, no overrides).
Procedure: `agentrs-alloc/3` — per-compiler-phase alloc rows from the instrument span (v2 had span totals + size classes only). GC leg profiles the shipped release `.node`;
the trace leg profiles the release+alloc-trace instrument build. Worker verbatim both legs.

## Worker samples per leg

| leg | syncMs | rssBefore | rssPeak | rssAfter |
| --- | --- | --- | --- | --- |
| gc (shipped) | 1185.8 | 105.4 MiB | 340.8 MiB | 319.0 MiB |
| trace (instrument) | 1454.7 | 96.6 MiB | 333.9 MiB | 311.8 MiB |

## Same-run phases (agentrs-phases/1)

One phases file per worker run; each leg reconciles internally. The GC
placements below still use the spawn-epoch bound (unchanged semantics) —
the phases add the per-stage wall the verdict never had.

| phase | gc-leg ms | trace-leg ms |
| --- | --- | --- |
| startup | 105.4 | 100.2 |
| config | 19.4 | 18.5 |
| scan | 356.9 | 355.7 |
| evaluate | 2.4 | 5.6 |
| compile | 758.4 | 1024.5 |
| publish | 48.5 | 48.2 |
| syncResidual | 0.0 | 2.1 |
| workerTail | 0.0 | 0.0 |
| syncTotal | 1185.7 | 1454.7 |

GC leg: RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker).
Trace leg: RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker).
Compile vs span (same run): compile 1024.5 ms, span 995.7 ms, delta 28.8 ms (N-API + JSON marshal outside the guard).

## R1 reproduction: GC census (`node --trace-gc`, shipped binary)

Events: 16 (Scavenge 14, Mark-Compact 2). First GC at 53 ms, last at 1265 ms.
V8 heap high-water: 51.7 MB before-GC, 37.0 MB after-GC.
R1 reference (Wave 4 hunter-r, enterprise): 12sc/0mc whole-run under both paths.
The whole-run count is the re-measurement; the verdict below places each full GC
against the measured compile window (trace leg), which is what R1 turns on.

## Handoff-window verdict (trace leg: span timestamps × same-process GC log)

PASS — zero in-window mark-sweep/mark-compact (1 head, 1 tail); R1's mechanism reproduced by measurement.

Window: 995.7 ms blocking call. Event times align to the window via the
spawn epoch (one-sided 60 ms spawn-latency bound; edge hits are ambiguous, never silent).

| tMs | kind | placement |
| --- | --- | --- |
| 100 | Mark-Compact | head |
| 1527 | Mark-Compact | tail |

## Rust side: reachable-live vs transient vs allocator-resident (compile span)

Blocking napi call: 995.7 ms. Transient: 938.6 MiB freed in-span
(8258149 blocks) of 946.6 MiB allocated (8259541 blocks, 1117430 reallocs).
Reachable-live (Rust): 13.9 MiB at span exit (5.9 MiB at enter,
net 8.1 MiB growth), 152.2 MiB span peak.

### Handed-off bytes (deterministic R1 ledger, measured in-span)

Files: 15122; contents 4.2 MiB + paths 1.2 MiB
+ request JSON 5.9 MiB = 11.3 MiB handed to the blocking call,
reachable-live on the JS side through the whole call.

### Allocator-resident (malloc default zone, whole process)

Zone at exit: 83.4 MiB reserved / 30.6 MiB in use /
52.8 MiB slack. Compile delta: 9.0 MiB reserved, 8.6 MiB in use.
Reserved counts whole region chunks claimed (never-faulted pages included), so it can
exceed RSS; the delta is the compile-attributable part. The zone covers malloc traffic
(Rust + Node C++); the V8 heap is mmap’d outside it, so the slack is the malloc-side story only.

### Span size classes (process cumulative alloc, live at span exit)

| class | alloc | blocks | live |
| --- | --- | --- | --- |
| <=32 B | 47.4 MiB | 5421025 | 0.0 MiB |
| <=128 B | 157.2 MiB | 2189014 | 0.0 MiB |
| <=512 B | 97.1 MiB | 501117 | 0.0 MiB |
| <=2048 B | 96.0 MiB | 115821 | 0.0 MiB |
| <=8192 B | 44.0 MiB | 13075 | 0.0 MiB |
| <=32768 B | 301.7 MiB | 19036 | 0.0 MiB |
| <=131072 B | 28.4 MiB | 451 | 0.0 MiB |
| >128 KiB | 180.8 MiB | 128 | 13.9 MiB |

## Compiler-phase allocation (Rust span, per phase)

Sequential slices of the blocking call: allocated/freed inside the phase,
net retained out of it, live at its edges. Peak stays span-global — it is
never attributed per phase.

| phase | wall ms | alloc | blocks | freed | net | live enter → exit |
| --- | --- | --- | --- | --- | --- | --- |
| request | 5.7 | 8.3 MiB | 42416 | 1.7 MiB | 6.5 MiB | 5.9 MiB → 12.4 MiB |
| collect | 51.0 | 37.0 MiB | 423895 | 30.8 MiB | 6.2 MiB | 12.4 MiB → 18.6 MiB |
| parse | 27.4 | 62.6 MiB | 9701 | 0.7 MiB | 61.9 MiB | 18.6 MiB → 80.5 MiB |
| constants | 48.0 | 237.2 MiB | 386014 | 206.8 MiB | 30.3 MiB | 80.5 MiB → 110.8 MiB |
| graphs | 39.7 | 31.7 MiB | 272837 | 46.3 MiB | -14.6 MiB | 110.8 MiB → 96.1 MiB |
| hosts | 50.6 | 76.9 MiB | 207775 | 76.8 MiB | 0.1 MiB | 96.1 MiB → 96.2 MiB |
| analysis | 35.2 | 76.2 MiB | 351845 | 56.2 MiB | 20.0 MiB | 96.2 MiB → 116.2 MiB |
| extract | 199.2 | 175.2 MiB | 2155031 | 139.0 MiB | 36.2 MiB | 116.2 MiB → 152.3 MiB |
| harvest | 55.1 | 9.9 MiB | 524000 | 9.8 MiB | 0.0 MiB | 152.3 MiB → 152.4 MiB |
| assembly | 409.9 | 180.7 MiB | 3506821 | 197.5 MiB | -16.9 MiB | 73.1 MiB → 56.2 MiB |
| partition | 33.4 | 35.0 MiB | 377646 | 35.0 MiB | 0.0 MiB | 56.2 MiB → 56.2 MiB |
| serialize | 5.3 | 16.1 MiB | 1557 | 8.1 MiB | 8.0 MiB | 30.3 MiB → 38.3 MiB |

Phase sums: 960.4 ms of 995.7 span ms;
946.6 MiB of 946.6 MiB span alloc,
809.0 MiB of 938.6 MiB span freed.
Unphased remainder: 35.3 ms, 0.0 MiB alloc,
129.6 MiB freed (guard gaps + prologue/epilogue + cross-thread noise;
phase teardown such as the retained-parse drop lands here, visible as live discontinuities).

## Scored-peak decomposition (enterprise RSS, legs cross-read)

Scored peak (GC leg, shipped): 340.8 MiB; after sync: 319.0 MiB (post-sync cliff 21.8 MiB).
Sync-added RSS (peak − before): 235.4 MiB; the Rust span peak (152.2 MiB) is ~65% of it (cross-leg, cross-run read).
V8 heap high-water: ~52 MB (mmap’d, outside the malloc zone).
Rust reachable-live at compile exit: 13.9 MiB (trace leg).
Malloc zone slack at compile exit: 52.8 MiB.
The legs agree with R1: with no full GC in the window, nulled old-space bytes
cannot leave RSS before the scored peak — the gap above reachable-live is
GC-timing/allocator-resident, not live data.

## Artifacts (which binary is which)

| build | profile | sha256 | builtVia |
| --- | --- | --- | --- |
| shipped | release | `393afb0aa3ff…` | napi build --release via ensure-native |
| trace | release+alloc-trace | `6af0ef6cb20f…` | napi build --release --features alloc-trace |

Shipped: `packages/reference-rs/dist/native/virtual-native.darwin-x64.node`. Trace: `packages/reference-rs/dist/native-trace/bf8177f88c81/virtual-native.darwin-x64.node`
(inputs bf8177f88c81; dist/native never touched).
