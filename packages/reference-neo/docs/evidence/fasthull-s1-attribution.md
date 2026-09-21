# S1 attribution — end-state retention (spike, DIED)

Time-boxed spike on the scored-RSS gap (308 → 261, 47 MiB). Two questions,
both answered with firsthand numbers. Verdict: **no verifiable ≥10 MiB
scored lever exists in either leg — spike DIED, attribution filed.**
No engine change; no bytes moved; css untouched.

Method: `/tmp/s1` probes (replica workers importing tree modules; bench
methodology untouched). `v8.writeHeapSnapshot` forces a full GC first
(proven: heapU 54.8 → 4.3 on a 50 MB garbage control) — so each snapshot
splits end-state V8 heap into reachable (in snapshot) vs garbage
(collected by the snapshot). Same-process RSS deltas are contention-free;
box ran load 4–10 with 5 siblings throughout (wall times affected,
splits and deltas robust). Probe absolutes ≠ bench-quiet 308 (probes
import the generator); the splits are the signal.

## (i) V8 end-state attribution — KILLED (garbage needs GC = unavailable)

Enterprise heapUsed-after: 26.9 / 19.8 / 19.8 / 19.8 / 15.9 MiB across
runs of identical work (±11 MiB GC-timing variance), vs 8.1 reachable
after snapshot-GC (import baseline 7.0). Decomposition:

| holder (enterprise) | MiB | reachable? | trim? |
| --- | --- | --- | --- |
| sheets 2×2.9 MB (UTF-16) + payload parsed + spec + prepared + bridge string | 8–19 (GC-timing) | NO — absent from every post-GC snapshot | GC-only → UNAVAILABLE |
| esbuild-retained Uint8Array (publish-react-localized, esbuild JS closure) | 1.9 (0.9 medium) | yes | sub-threshold, not an explicit clearable structure |
| eval-script module cache + compiled code + misc reachable | ~1 | yes | sub-threshold |
| import baseline (node/amaro/modules) | 7.0 | yes | not sync's |

Proofs: (a) post-GC snapshots contain zero sheet/payload/spec-sized
strings in the real-`sync()` shape; (b) mid-publish esbuild pressure
collects ~8 MB in-probe (medium heapU 11.9 → 10.4); (c) a no-react
replica keeps sheets only via a stack-slot liveness artifact — confirming
their identity as the garbage, not as retained state; (d) `stagedBaseSystems`
is consumed on write (code-verified, `system.ts:230-240`); (e) recon's
prepare +23 MB = file-content strings + glob overhead, all unreachable at
end (phased probe: prepare +1.9 heapU medium from GC-clean start).

Sync-retained reachable ≈ 1–3 MiB, 3× below the kill-fast bar, with no
explicit post-consume clearable structure. Leg (i) is dead: the only V8
lever is forcing collection, which the brief kills as gaming.

## (ii) Allocator residue — KILLED as a lane (mechanism proven, unverifiable)

Temp macOS-only `s1_pressure_relief` napi export (added, measured,
reverted; binary rebuilt clean — zero tree residue):

- Relief at end-state: **−24.1 / −24.1 / −25.9 / −24.1 MiB, 4/4 runs.**
  ~24 MiB of dead magazine pages genuinely return to the OS.
- Placement predictor (relief right after `native.compile`): end −24,
  publish regrows +13, product placement would be end-of-compile inside
  Rust (sampler-blind window) — a sketch, not a shape.
- **Run-to-run end-state spread swallows the signal:** like-for-like
  enterprise ends 286–378 MiB (n=5: 286/291/314/362/378, σ≈36) while V8
  heap reads bit-identical across three of them (heapU 19.8 ×3) — the
  variance is 100% allocator-side. Leading hypothesis: `std` HashMap
  `RandomState` across extract/resolver/hosts reorders the allocation
  sequence per process (ASLR/fragmentation lottery); unproven, out of
  spike scope to prove.
- Verification math: signal 24 vs σ≈36 needs ~70 quiet runs per arm —
  no quiet box exists tonight (5 siblings), spike is time-boxed. Fasthull
  demands a win clear the measured spread. It cannot. Kill-fast applies.
- Drop-order: rejected on paper — end-state magazine content is
  order-independent; it would only reshuffle the lottery at the same
  heroic N. Dedicated-heap sketch (mimalloc/jemalloc `global_allocator`):
  new dependency + global free→OS behavior change = product architecture,
  needs the HQ ruling recon already framed — not built.
- Side datum: second sync in one process +123 MiB (V8 heap +59, native
  +64) — magazines partially reuse, V8 never collects between syncs.
  Watch-mode note; scorer runs one sync per child, out of scope.

## Verdict

| leg | finding | verdict |
| --- | --- | --- |
| V8 end-state | ~2 MiB reachable/retainable, 8–19 MiB GC-only garbage | KILLED (unavailable) |
| allocator residue | −24 MiB mechanism proven, spread ±36 kills verification | KILLED (unverifiable; feeds morning Q1) |

The last RSS mile is the morning allocator-strategy question, with one
new hard number: only ~24 of the ~150–190 dead-resident MiB respond to
zone pressure — the rest needs a real allocator decision, not a call.
