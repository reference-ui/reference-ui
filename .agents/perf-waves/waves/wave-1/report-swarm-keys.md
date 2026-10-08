# REPORT: swarm-keys — lookup-key serialization diet

## Verdict

**CUT (addressable incl mass 19wt ≈ 19ms cannot clear the ~21ms LAND bar even at 100% capture; realistic capture ~40% ≈ 8–10ms)**

One line: duplication is real (5.54x) but the frame is too small — the whole `serialize_lookup_key` subtree is 19wt and the bar needs ≥15ms + ≥1.5% of ~1400ms sync.

## Base

- Base commit: `1a57b1e80daaa6b062a2a02e6ad4cc66e56d5402` (verified `git rev-parse HEAD` before any work)
- Base `.node` sha256: `5349c06f06848d9a954c1d9371c193f7f4ff079a311b542a1d863ba3272c2eee`
  (`packages/reference-rs/dist/native/virtual-native.darwin-x64.node`, restored in tree, hash re-verified after revert)
- Candidate `.node` sha256: N/A — CUT before implementation, no candidate built
- `git diff --stat`: empty (all temp instrumentation reverted; only this REPORT.md is untracked)

## Mechanism counts (enterprise, seed 7, 7527 css calls)

Measured with a temporary env-gated dump (`SWARM_KEYS_DUMP`, site-tagged per
`serialize_lookup_key` call; instrumentation fully reverted). Raw dump preserved at
`/tmp/swarm-keys-dump-ent.txt` (106,278 lines); instrumented binary at
`/tmp/swarm-keys-instr.node` (`c66a3f30…`); base binary at `/tmp/swarm-keys-base.node`.

| site | serializations | unique keys | multiplicity |
| --- | --- | --- | --- |
| decl (`build_keyed` per authored decl) | 35,426 | 19,187 | 1.85x |
| exact (`Proof::collect_exact` per expected fact) | 70,852 | 19,187 | 3.69x |
| reject / sink / other | 0 | — | — |
| **total** | **106,278** | **19,187** | **5.54x** |

- decl ∩ exact sets are **identical** (overlap 19,187; decl-only 0; exact-only 0): every
  declaration key is serialized once as a decl and ~3.7x more as expected facts.
- Value shapes: 90,579 scalar-only (85%, `canonical_json_value` clone is pure waste),
  15,699 containing objects (15%).
- Small-scale check agreed (2,277 serializations / 682 unique = 3.34x, full decl∩exact overlap).

So the duplication gate in the brief **passed** — the kill comes from the LAND math, not the dup rate.

## Why it can't land (flame math)

Compile-scope weights (`enterprise-flame3`, weight ≈ ms):

- `serialize_lookup_key` incl **19wt** (callers: `OwnedLookupKey::lookup_key` 12wt, `build_keyed` 7wt)
- `canonical_json_value` incl 12wt sits *under* it (not additive); `authored_key` 9wt is
  owned-key *construction*, a different mechanism, out of scope
- Generous ceiling incl. caller-frame overhead (`when`-vec clone etc.): ~24wt ≈ 24ms
- LAND bar on enterprise syncMs (~1400ms): ≥15ms **and** ≥1.5% ≈ **≥21ms**
- Required capture: ≥88% of the ceiling; realistic capture ~40%:
  memo hits still pay hash + clone per fact, decl-side dupes are only 15% of volume,
  and the 85% scalar fast-path saves only the clone fraction of remaining calls
- Projected delta ≈ 8–10ms ≈ 0.6% — misses both prongs, and scan-phase kernel noise
  (~364ms, `__open`-heavy) would further smear a signal that small

Prior art already took the biggest structural win on this path: the `!proof` bench path
uses `build_diet` + carried keys + `render_session_with_keys`, so the emitted-set
re-serialization is gone; only per-decl and per-fact serializations remain.

## A/B, output hashes, determinism

Not run — no candidate was built. Running a 6-pair A/B against a hypothesis whose
ceiling sits below the bar would burn the shared bench lock for a foregone CUT.

## Notes for future work

- The 5.54x duplication is real and concentrated: one memo at `Proof::collect_exact`
  (keyed by `&OwnedLookupKey`, needs a `Hash` impl) plus a decl-identity pre-check in
  `build_keyed` (sound under any serde_json map backend — `seen_keys` stays the
  authority) would eliminate ~63% of serializations. It just isn't 21ms.
- If the bar ever becomes per-phase (compile ≈ 780ms → ~12ms), this hypothesis
  becomes viable again; the counts above are the design input.
- Cross-check: no untagged (`?`) serializations appeared in the dump, so decl + exact
  are the complete bench-path key volume. `render_expected` (compiler channel),
  `emitted_keys` (proof path), and `exact_keys` (test-only) do not run in bench.
