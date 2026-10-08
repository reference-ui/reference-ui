# Counters report: enterprise (latest)

Load: 3000 style files + 12000 dead, 7527 css() calls,
120 recipes, seed 7 (frozen app plan, no overrides).
Procedure: `agentrs-counters/1`. Span leg profiles the release+counters-trace
instrument build (exact compile window); the census leg profiles the shipped
release `.node` under the interpose shim (whole worker, startup-subtracted).
Worker verbatim every leg; wall time on instrument legs is unscored.

## Worker samples per leg

| leg | syncMs | rssBefore | rssPeak | rssAfter |
| --- | --- | --- | --- | --- |
| span (instrument) | 1182.1 | 95.6 MiB | 307.3 MiB | 288.9 MiB |
| census (shipped+shim) | 1198.5 | 95.1 MiB | 326.9 MiB | 304.9 MiB |

## Span counters (exact compile window, 725.7 ms blocking call)

| counter | delta |
| --- | --- |
| instructions | 9,509,354,919 |
| cycles | 3,978,907,872 |
| IPC (instr/cycle) | 2.39 |
| stall cycles (width-4 bound) | 1,601,569,142 (40%) |
| user CPU (rusage) | 639.0 ms |
| sys CPU (rusage) | 86.6 ms |
| unix syscalls | 13,751 |
| mach syscalls | 116 |
| page faults (events) | 48,519 |
| minor faults (rusage) | 48,519 |
| major faults (rusage) | 0 |
| pageins (disk-backed) | 0 |
| copy-on-write faults | 0 |
| context switches | 11 |
| voluntary csw | 0 |
| involuntary csw | 11 |
| mach messages sent/rcvd | 64 / 32 |
| disk read/written | 0.0 MiB / 0.0 MiB |
| phys footprint delta | 21.7 MiB |
| threads enter/exit | 11 / 11 |
| window top-thread share | 100% |

## Census (libc calls, whole worker minus bare-node startup)

| call | count | total ms | avg µs | bytes |
| --- | --- | --- | --- | --- |
| close | 15,405 | 11.62 | 0.75 | — |
| fstat | 70 | 0.06 | 0.92 | — |
| lseek | 0 | 0.00 | n/a | — |
| lstat | 324 | 0.72 | 2.23 | — |
| mmap | 336 | 0.92 | 2.74 | 8,795,586,560 |
| munmap | 651 | 4.56 | 7.01 | — |
| open | 15,407 | 239.35 | 15.54 | — |
| openat | 27 | 0.13 | 4.73 | — |
| pread | 439 | 0.47 | 1.06 | 2,940,999 |
| pwrite | 0 | 0.00 | n/a | 0 |
| read | 30,529 | 25.72 | 0.84 | 5,885,471 |
| readv | 0 | 0.00 | n/a | 0 |
| stat | 3,882 | 9.54 | 2.46 | — |
| write | 389 | 3.83 | 9.84 | 10,577,084 |
| writev | 0 | 0.00 | n/a | 0 |

Counts flagged ~noisy went negative after startup subtraction (run-to-run
jitter exceeds the sync-attributable signal for that call); treat as zero.
mmap bytes are virtual length requested (reservations), not bytes touched;
read/pread/readv/write/pwrite/writev bytes are bytes transferred.

## Floor-vs-waste reading (counters alone; flame/alloc join lives in the crew log)

- File-IO room: open/openat: 15,434 total, 1.03 per file, 15.5 µs avg → FLOOR — about one open per file; opens are load, not waste.
- Syscall room: unix syscalls in-window: 13,751 (0.9 per file); sys CPU 86.6 ms of 725.6 ms CPU (12% sys).
- Compute room: IPC 2.39 → healthy — some headroom in stalls; stall share 40% against a width-4 bound.
- Compute room: Window top-thread share 100% (11 / 11 threads) → single-threaded — parallel lanes have headroom.
- Memory room: Faults: 48,519 minor + 0 major (rusage), 0 pageins → warm — zero disk-backed faults in-window.
- Memory room: Disk IO: 0.0 MiB read / 0.0 MiB written; footprint delta 21.7 MiB; involuntary csw 11.

Bounds used: one open per file is the floor; IPC is read against a
conservative sustained width of 4 (this box: Intel Raptor Cove, 6-wide
decode — a stricter width only raises the stall share). Stall cycles =
cycles − instructions/width. LLC misses are not countable rootless on macOS;
IPC + stalls + faults are the honest proxies.

## Artifacts (which binary is which)

| build | profile | sha256 | builtVia |
| --- | --- | --- | --- |
| shipped | release | `5ac6c07e9f8d…` | napi build --release via ensure-native |
| counters | release+counters-trace | `d54c6b3d6ca5…` | napi build --release --features counters-trace |
| shim | interpose dylib | `94c7e5d1ad71…` | Apple clang version 17.0.0 (clang-1700.0.13.5) |

Shipped: `packages/reference-rs/dist/native/virtual-native.darwin-x64.node`. Counters: `packages/reference-rs/dist/native-trace/a33f89c47dea-counters/virtual-native.darwin-x64.node`
(inputs a33f89c47dea; dist/native never touched).
Shim source: `.agents/skills/agent-rs/scripts/counters-interpose.c` (built to a temp dir per run, deterministic).
