# Mission: Operation Flamegraph Correct — correction pass before Wave 5

Status: `active` (captain on conn 2026-09-21, Obj 1 crew dispatched; GO from HQ).

A review of the closed Operation Flamegraph (all 5 objectives verified
2026-09-21) found its foundation solid — frozen workload, real N-API
path, preserved raw profiles, binary hashes, separate instrumented
builds, Criterion coverage — but five measurement defects that could
misdirect the next round, plus one attribution gap. This mission fixes
the measurements, regenerates the evidence and the recon, and only
then releases Wave 5 to targeted experiments. No speedups ship here
either; the deliverable is corrected instruments plus recon v2.

The review changed no files and reran no enterprise benchmark: every
finding below reproduces from filed raw evidence plus calculation
checks. Triage by the captain confirmed the code mechanics of issues
1, 3, 4, 5 by direct reading and concurred on issue 2.

## Issues (each is an objective's acceptance core)

1. **Function ranking wrong** (`flame-summary.mjs:48`
   `collectSelfHits`): groups by `resource:address:func`, never merges
   same-function addresses, ignores sample weights. Reviewer
   reprocessing gives `resolve_alias` 26 self samples vs the report's
   "hottest Rust function has nine". Fix aggregation; publish self AND
   inclusive costs.
2. **Mixed measurement windows** (recon §2 decomposition): flame
   covers the whole worker, census subtracts an empty Node process,
   the worker measures `sync()` post-import, and the span comes from
   another run — the per-stage ms are not a reconciled decomposition.
   Add common same-run boundaries (startup, scanning/evaluation,
   native compilation, publishing). Note: low JS self % does not bound
   savings from JS-driven native/fs work.
3. **Unestablished ceilings** (`counters-evidence.mjs:126`
   `stallOf = cycles − instr/4`): a width assumption, not a measured
   stall counter. Cannot support the "hard ≤12% ceiling" or the
   stop-optimizing recommendation — and the recon's gap note has the
   width logic backwards (stricter width raises the cap). Withdraw both.
4. **RSS sampler misses native peaks** (`worker.ts:24`): `setInterval`
   on the thread blocked by compilation cannot fire mid-`sync()`;
   filed run shows worker 307.3 MiB vs OS high-water 318.1 MiB.
   Measure independently of the main event loop. CROSS-MISSION:
   `worker.ts` is the voyage's shared scorer — fix behind a versioned
   procedure so bench history (incl. active Fasthull numbers) stays
   comparable.
5. **Parallelism metric ignores thread births**
   (`counters-evidence.mjs:85` `windowThreadDeltas`): threads absent
   from the enter snapshot are skipped; reproduced 100% reported vs
   ~25% actual with four new workers. Would wrongly kill the
   parallel-compile experiment. Attribute unmatched threads (enter as
   zero and/or born/died counts with a bounded share).
6. **Alloc attribution gap** (enhancement): the alloc instrument is a
   census (totals, size classes) with no allocation-site attribution.
   Add allocation counts by compiler phase to target reserve/arena work.

## Decision-gate corrections (for recon v2)

- Wins are decided by repeated, matched, uninstrumented end-to-end
  runs with correctness, RSS, and bundle-size checks.
- Counters and microbenchmarks explain results; they do not gate them.
- The criterion-first bar must not reject improvements that call a
  function less often rather than making it faster.

## Deliverables

- [x] Corrected flame aggregation (self + inclusive, weighted) with
      republished summaries from the preserved raw profile. (landed
      2026-09-21, verified firsthand, procedure agentrs-flame/2,
      republished at docs/evidence/flamegraph/enterprise-flame2/)
- [ ] Same-run phase boundaries across all legs; reconciled
      decomposition replacing recon §2.
- [ ] Corrected counters derivations (stall withdrawn, thread
      birth/death handled).
- [ ] Independent RSS sampler behind a versioned bench procedure.
- [ ] Alloc counts by compiler phase.
- [ ] Regenerated enterprise evidence + recon v2 (revised bars,
      withdrawn ceilings, corrected numbers).

## Rules

- Locked load, always; agent-rs gates apply to harness code too.
- Raw profiles and prior bundles are preserved, never overwritten in
  place — republished outputs carry procedure versions that say what
  changed.
- One crew, one tree, captain merges; evidence over vibes, as ever.
