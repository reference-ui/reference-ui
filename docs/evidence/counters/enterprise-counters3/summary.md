# Counters report: enterprise (latest)

Load: 3000 style files + 12000 dead, 7527 css() calls,
120 recipes, seed 7 (frozen app plan, no overrides).
Procedure: `agentrs-counters/3` — width-assumption stall bound withdrawn (no ceiling claimed); in-window thread births attributed at their exit rows with died-thread counts and a rusage-bounded unattributed share (v2 skipped threads absent from the enter snapshot). Span leg profiles the release+counters-trace
instrument build (exact compile window); the census leg profiles the shipped
release `.node` under the interpose shim (whole worker, startup-subtracted).
Worker verbatim every leg; wall time on instrument legs is unscored.

## Worker samples per leg

| leg | syncMs | rssBefore | rssPeak | rssAfter |
| --- | --- | --- | --- | --- |
| span (instrument) | 1193.9 | 92.3 MiB | 343.7 MiB | 321.6 MiB |
| census (shipped+shim) | 1197.9 | 89.6 MiB | 349.1 MiB | 326.9 MiB |

## Span counters (exact compile window, 740.0 ms blocking call)

| counter | delta |
| --- | --- |
| instructions | 9,538,524,032 |
| cycles | 4,044,838,430 |
| IPC (instr/cycle) | 2.36 |
| user CPU (rusage) | 647.8 ms |
| sys CPU (rusage) | 92.0 ms |
| unix syscalls | 14,750 |
| mach syscalls | 114 |
| page faults (events) | 55,608 |
| minor faults (rusage) | 55,608 |
| major faults (rusage) | 0 |
| pageins (disk-backed) | 0 |
| copy-on-write faults | 0 |
| context switches | 34 |
| voluntary csw | 0 |
| involuntary csw | 34 |
| mach messages sent/rcvd | 60 / 30 |
| disk read/written | 0.0 MiB / 0.0 MiB |
| phys footprint delta | 17.3 MiB |
| threads enter/exit | 11 / 11 |
| threads born/died in-window | 0 born / 0 died |
| window top-thread share (matched + born) | 100% |
| window CPU unattributed (died-thread bound) | 0.0 ms (0%) |

## Census (libc calls, whole worker minus bare-node startup)

| call | count | total ms | avg µs | bytes |
| --- | --- | --- | --- | --- |
| close | 15,407 | 12.74 | 0.83 | — |
| fstat | 71 | 0.06 | 0.81 | — |
| lseek | 0 | 0.00 | n/a | — |
| lstat | 325 | 0.75 | 2.30 | — |
| mmap | 337 | 1.12 | 3.34 | 8,796,110,848 |
| munmap | 651 | 4.48 | 6.88 | — |
| open | 15,409 | 244.54 | 15.87 | — |
| openat | 27 | 0.12 | 4.57 | — |
| pread | 439 | 0.48 | 1.08 | 2,940,999 |
| pwrite | 0 | 0.00 | n/a | 0 |
| read | 30,530 | 23.81 | 0.78 | 5,890,004 |
| readv | 0 | 0.00 | n/a | 0 |
| stat | 3,884 | 9.92 | 2.56 | — |
| write | 390 | 3.68 | 9.44 | 10,578,495 |
| writev | 0 | 0.00 | n/a | 0 |

Counts flagged ~noisy went negative after startup subtraction (run-to-run
jitter exceeds the sync-attributable signal for that call); treat as zero.
mmap bytes are virtual length requested (reservations), not bytes touched;
read/pread/readv/write/pwrite/writev bytes are bytes transferred.

## Same-run phases (agentrs-phases/1)

One phases file per worker run; the span leg and the census leg each
reconcile internally, and the libc events bucket into the census run's
own windows. Startup is measured in-run now — the startup-subtracted net
above stays for v1 comparability.

| phase | span-leg ms | census-leg ms |
| --- | --- | --- |
| startup | 84.1 | 83.9 |
| config | 18.9 | 21.3 |
| scan | 353.2 | 360.2 |
| evaluate | 5.7 | 5.6 |
| compile | 768.4 | 759.2 |
| publish | 47.5 | 49.6 |
| syncResidual | 0.0 | 1.9 |
| workerTail | 0.0 | 0.0 |
| syncTotal | 1193.8 | 1197.8 |

| phase | census calls | census ms | top call (ms) |
| --- | --- | --- | --- |
| startup | 1,551 | 5.91 | open (2.83) |
| config | 132 | 0.60 | open (0.16) |
| scan | 60,858 | 269.06 | open (239.42) |
| evaluate | 12 | 3.49 | read (3.34) |
| compile | 3,758 | 9.02 | stat (8.29) |
| publish | 898 | 10.41 | write (3.50) |
| syncResidual | 19 | 0.06 | openat (0.05) |
| workerTail | 0 | n/a | — |
| preMain | 7 | 0.02 | open (0.01) |
| postWorker | 366 | 3.48 | munmap (3.32) |

Span leg: RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker).
Census leg: RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker).
Compile vs span (same run): compile 768.4 ms, span 740.0 ms, delta 28.5 ms (N-API + await overhead outside the guard).
Events: 67,601 bucketed, 0 dropped; buckets proven against the schema-1 census beside the log.

## Floor-vs-waste reading (counters alone; flame/alloc join lives in the crew log)

- File-IO room: open/openat: 15,436 total, 1.03 per file, 15.9 µs avg → FLOOR — about one open per file; opens are load, not waste.
- Syscall room: unix syscalls in-window: 14,750 (1.0 per file); sys CPU 92.0 ms of 739.8 ms CPU (12% sys).
- Compute room: IPC 2.36 → healthy.
- Compute room: Window top-thread share 100% (11 / 11 threads, 0 born / 0 died) → single-threaded — parallel lanes have headroom.
- Memory room: Faults: 55,608 minor + 0 major (rusage), 0 pageins → warm — zero disk-backed faults in-window.
- Memory room: Disk IO: 0.0 MiB read / 0.0 MiB written; footprint delta 17.3 MiB; involuntary csw 34.

Bounds used: one open per file is the floor. No width assumption is made:
instructions and cycles are measured (rusage_info_v4) and read as IPC,
with faults, pageins, and disk IO beside them. LLC misses are not
countable rootless on macOS; IPC + faults are the honest proxies, and
they explain results — no ceiling on possible savings is claimed here.
Thread births inside the window count at their exit rows (exact); any
remainder of window CPU past the exit-visible threads is reported as
unattributed, bounding what died threads could have carried.

## Artifacts (which binary is which)

| build | profile | sha256 | builtVia |
| --- | --- | --- | --- |
| shipped | release | `5ac6c07e9f8d…` | napi build --release via ensure-native |
| counters | release+counters-trace | `d54c6b3d6ca5…` | napi build --release --features counters-trace |
| shim | interpose dylib | `d9e5130fcf54…` | Apple clang version 17.0.0 (clang-1700.0.13.5) |

Shipped: `packages/reference-rs/dist/native/virtual-native.darwin-x64.node`. Counters: `packages/reference-rs/dist/native-trace/a33f89c47dea-counters/virtual-native.darwin-x64.node`
(inputs a33f89c47dea; dist/native never touched).
Shim source: `.agents/skills/agent-rs/scripts/counters-interpose.c` (built to a temp dir per run, deterministic).
