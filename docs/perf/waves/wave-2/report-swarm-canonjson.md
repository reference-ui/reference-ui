# REPORT: swarm-canonjson — per-object `canonical_json_value` diet

## Verdict

**CUT (whole-function fantasy ≈ 6 ms, object-path realistic ≈ 3 ms — clears
neither the ≥15 ms nor the ≈16.1 ms LAND prong; counted, never built, no
lock hold)**

One line: the seed-7 enterprise load drives 10,466 flat 2-or-4-key objects
(31,332 inserts, zero nesting, zero numbers) through `canonical_json_value`,
whose entire inclusive cost on the landed base is 6 wt ≈ 6 ms across all
callers and paths — the per-object BTreeMap rebuild is a strict fraction
of that, so no diet on this mechanism can threaten either prong.

## Base / binaries

- Base commit: `810b8b5b47448b4b99b688d9c2fda94c3ec9658e` (verified
  `git rev-parse HEAD` before any work; re-verified after)
- Base `.node` sha256: N/A — never built (fresh worktree; a from-scratch
  release build plus instrumented counts would burn shared-box CPU for
  zero information on a ceiling-barred mechanism)
- Candidate `.node` sha256: N/A — CUT before implementation, no candidate built
- `git diff --stat`: empty (zero tracked edits; only this REPORT.md is untracked)
- Bench lock: never held by this crew (counted, never built, no lock hold).
  No spawned run of any kind, timed or untimed — no `flame.mjs`/agent CLI
  subprocess, no build, no test run; every number below is the filed record
  plus a read-only one-pass census of the preserved wave-1 key dump.

## Mechanism (one)

Hypothesis (btreeset §Collision reseed): object values rebuild a `BTreeMap`
per object inside `canonical_json_value` (`serializer.rs:13-17`) —
thousands of inserts across ~15,699 objects — so diet the per-object
rebuild: presized maps, insert avoidance where key order is already
canonical, borrow where ownership allows.

What the census + code actually show:

- `serde_json` runs with `preserve_order` (`atomic/Cargo.toml:22`), so
  `Map` is an `IndexMap` — insertion-ordered, sort NOT vacuous. The
  rebuild is semantically required in general; only a per-object
  already-sorted check can skip it.
- The "presized/exact-capacity maps" third of the hypothesis is VOID by
  API fact: `BTreeMap` has no `with_capacity` — nodes allocate per
  insert. There is nothing to presize.
- The only real diet shape is a sortedness pre-check + rebuild skip
  (or borrow in the caller). For 2-key objects the check (~1 short
  compare) is itself the same order as the rebuild it skips; realistic
  net ≈ 1–2 ms (see §Why it can't land).

## Mechanism counts (enterprise, seed 7)

One-pass read-only census of the preserved wave-1 site-tagged dump
(`/tmp/swarm-keys-dump-ent.txt`, 106,278 tuples — the corpus keys2's
phase method validated to 6% against the filed flame weight):

| quantity | old base (dump) | new base (derived) | basis |
| --- | --- | --- | --- |
| `serialize_lookup_key` tuples | 106,278 | 70,852 | diag killed the render_expected third (absent ×2 in repro) |
| top-level objects | 15,699 | **10,466** | decl 5,233 + collect_exact 5,233 (exact == decl ×2 positionally, keys2) |
| object key histogram | {2: 7,899, 4: 7,800} | {2: 5,266, 4: 5,200} | exact per-bucket 2× decl (this census) |
| BTreeMap inserts (Σ keys) | 46,998 | **31,332** | decl 15,666 × 2 |
| key byte sizes | {2 B: 31,299, 4 B: 15,699} | {2 B: 20,866, 4 B: 10,466} | breakpoint names (`base`/`sm`/`md`/`lg`), ×2/3 |
| nested objects / arrays | **0 / 0** | 0 / 0 | max depth 2: every container is flat scalars |
| JSON numbers anywhere | **0** | 0 | keys2 filed; leaves are all strings |
| top-level arrays (len 2) | 8,121 | 5,414 | not this mechanism (no BTreeMap), inside the profile bound |

Call-site map (exhaustive grep over `packages/reference-rs`):

| caller of `canonical_json_value` | sites | bench volume |
| --- | --- | --- |
| `serialize_lookup_key` (objects/arrays only; scalars borrowed — keys2) | `builder.rs:33` (decl), `facts.rs:33` (exact) | 70,852 calls (35,426 + 35,426) |
| `serialize_value` via analysis `value_spelling` | `render.rs:36` → `render_expected` | **0** (absent ×2 post-diag) |
| `serialize_value` via proof `value_spelling` | missing-plan warning sentences | rare (warnings only), inside profile bound |
| recursion + tests | — | vacuous on bench (0 nested objects) |

Key-order-already-canonical fraction: unrecoverable from output (sorted
by construction) and unmeasured — correctly so, because the ceiling math
assumes 100% (max fantasy for the skip-check sub-mechanism) and still bars.

Filed-profile corroboration (landed base `810b8b5b4`, repro1/repro2 —
the corrected record, NOT flame3):

- `canonical_json_value` incl **6 wt** (repro1; absent from every repro2
  table = below noise there). Compile 654.5 ms / 653 wt ⇒ ≈ **6.0 ms**
  for the WHOLE function: objects + arrays + scalar clones + recursion +
  drops + both `serialize_value` paths.
- `BTreeMap::insert` incl 14 wt (repro1), of which canonical holds **1 wt**
  (rest: styletrace surface 6, module_graph 6, Once 1). Malloc-by-ancestor
  canonical 4 wt.
- Repro report: serialize 19→16 wt, canonical 10→6 wt — keys2's −3.3 ms
  phase win reproduced to the weight unit. Remainder 16; canonical 6.

## Why it can't land (ceiling math)

LAND bar on the ~1073 ms new base: ≥15 ms **and** ≥1.5% (≈16.1 ms).
Two independent bounds, agreeing:

| bound | math | fantasy (100% capture) |
| --- | --- | --- |
| profile share (total, all callers/paths) | `canonical_json_value` incl 6 wt ≈ 6.0 ms | **~6 ms** |
| op count (lookup path, exact census) | 31,332 inserts × generous 250 ns (btreeset precedent — 5–10× realistic for single-node ≤4-key trees with 2–4 B keys) + 10,466 × generous 150 ns fixed (new/collect/drop) | **~9.4 ms** |

The profile bound is the tighter, load-measured one; the op-count bound
is deliberately absurd-generous and still bars. Realistic op cost
(~30–50 ns/insert + ~150 ns fixed) gives ~2.8 ms — consistent with the
6 ms whole-function total that also carries 5,414 arrays and the proof
`serialize_value` path.

The fantasy misses the ms prong by 2.5× (6 vs 15) and the pct prong by
2.7× (6 vs 16.1) at impossible 100% capture of the ENTIRE function —
which impossibly assumes deleting the array path, scalar clones, and
drops alongside the object rebuilds. My mechanism (object BTreeMap path
only) is a strict fraction: realistic diet net ≈ 1–2 ms, since the
sortedness check itself costs ~1–3 short compares per object. An 8-pair
confirm (~25 min of exclusive shared lock) cannot resolve 1–2 ms from
±20–70 ms machine noise (btreeset precedent).

Robustness: the CUT stands on EITHER base — even pre-set-1, canonical
was 10 wt ≈ 9.1 ms, clearing neither old-base prong (15 / ~18.5). The
reseed observation never ran the numbers; the hypothesis was stillborn
before set-1 landed. It also fails keys2's per-phase bank bar (≥5 ms +
≥25%): realistic ~1–2 ms < 5 ms floor.

This CUT follows the btreeset (6–9 ms fantasy → CUT, never built —
this hypothesis's own parent), modgraph (11–12), harvest (12.5),
findprop (13.1), rhythm (3.2), resolvefmt (2.9), and lowermemo (4.3)
precedents — every one of them ceiling-barred at a HIGHER fantasy than
this mechanism, every one accepted without override. The BANK rule
governs implemented diets whose ceilings cleared but stopwatches
couldn't resolve (cascade/parse/keys2/scalarjson/hashers/extract/
collect/proof); it does not mint banks from sub-ceiling triage.

## A/B, output hashes, determinism

Not run — no candidate was built (zero tracked diff; there is no
alternate artifact to compare). Running an 8-pair A/B on a ~1–2 ms
realistic mechanism would burn the shared bench lock for a foregone
CUT (swarm-keys precedent).

Determinism: the mechanism counts are filed-record facts (repro1/repro2
bundles, keys2-validated dump) plus code-logic facts (2 live
`serialize_lookup_key` sites, `render_expected` 0 calls post-diag,
`preserve_order` ⇒ `IndexMap`, `BTreeMap` has no capacity API); no runs
exist to compare.

## Correctness (rule 1)

- (a) Zero diff: no suites apply. Post-work tree verified byte-clean
  (`git status` shows only `?? REPORT.md`, `git diff --stat` empty,
  pin re-verified `810b8b5…`).
- (b)/(c) Vacuous — nothing changed.

## JSON-shape section (canonical-form proof)

- No JSON-shape change was made: canonical form (key-sort order +
  spellings) is untouched, so byte-parity is vacuous, not merely tested.
- The form contract is load-bearing and identified for any future diet:
  `plans.ts:35` pins the TS side to byte-exact match of Rust
  `canonical_json_value`; `serialize_value` spells diagnostics from the
  same function. Any revival must preserve sorted-key order and serde
  string/number spellings for every value.
- Differential fuzzing (scalarjson method: full-corpus byte-parity +
  adversarial key orders/unicode/escapes, 0 divergences) was NOT run —
  there is no alternate writer to fuzz. The obligation transfers to the
  FILLER below as its bank condition (rhythm precedent: proof sketched,
  adversarial corpus deferred as verdict-irrelevant).

## FILLER (exact code filed, ~1–2 ms, bank only in a sum)

Resuscitation shape if a future sum wants this ~1–2 ms (sortedness
pre-check in the object arm; byte-identical by construction — sorted
input rebuilds in the same order; unsorted input takes the legacy path
verbatim):

```rust
Value::Object(map) => {
    // Map is IndexMap (preserve_order): skip the BTreeMap rebuild
    // when iteration order is already canonical.
    let mut prev: Option<&str> = None;
    let mut sorted = true;
    for key in map.keys() {
        if let Some(p) = prev {
            if p >= key {
                sorted = false;
                break;
            }
        }
        prev = Some(key);
    }
    if sorted {
        Value::Object(map.iter().map(|(k, v)| (k.clone(), canonical_json_value(v))).collect())
    } else {
        let mut rebuilt = BTreeMap::new();
        for (k, v) in map {
            rebuilt.insert(k.clone(), canonical_json_value(v));
        }
        Value::Object(rebuilt.into_iter().collect())
    }
}
```

Bank conditions (ALL): differential fuzz vs the pre-change oracle
(scalarjson method, 0 divergences, incl. adversarial key orders/unicode/
escapes/nesting); 106,278-corpus byte-parity; 4-scale byte-identity;
suites + `q` green; phase-bench (keys2 method) proving the ~1–2 ms;
never solo (fails both the whole-sync bar and the 5 ms per-phase floor).

## Collision / scope notes (for the captain)

- Untouched per brief + race rule: `serialize_lookup_key` tuple framing
  (scalarjson's banked fast frame, pending set-2 — EXPECTED adjacency:
  a revived FILLER would sit in `canonical_json_value`'s object arm,
  disjoint lines from scalarjson's scalar branch; stacking = fewer
  canonical calls × cheaper canonical calls, set-3+ integrator bisects);
  scalar borrow + generic `W` (keys2's LANDED diet — cited, not
  relitigated; this census builds on its dump + validated phase method);
  `serialize_value` diagnostics policy render paths (diag/proof ground —
  read for the call-site map, never edited).
- Hashers (banked, pending set-2): PROVABLY disjoint — `BTreeMap` is
  order-based and hasher-free, so a SipHash→Fx diet cannot touch this
  mechanism; `hashers.patch` greps clean of `serializer`/`canonical`
  (60 files; only import-list cleanups mention BTreeMap).
- Proof (banked, new base): proof-render diet composes with a revived
  FILLER (fewer `serialize_value` calls × cheaper canonicalization);
  no shared lines with this (empty) diff.
- Btreeset (CUT, parent): this report closes its reseed loop — the
  per-object rebuilds it flagged are real in code (31,332 inserts) but
  ceiling-barred in profile (6 wt whole-function). The `plan.rs:204`
  names-set half of its reseed is untouched (nameset CUT covers adjacent
  ground).
- Standing load facts used (not re-derived): one native compile per
  sync (btreeset); exact == decl ×2 positionally (keys2); 106,278 =
  decl + collect_exact + render_expected with the third gone post-diag
  (posreuse + repro); bench is `!proof` exclusively (asmfmt).

## Process note (method)

- Brief's "first commands" (`docs/evidence/README.md`, `flame.mjs
  --inspect` on canonical/serialize frames, `--callers`) were satisfied
  by reading the filed repro1/repro2 `summary.md`/`callers.md` records
  plus exhaustive source grep instead of re-deriving via the CLI —
  identical data source, zero CPU, correct with no lock held (btreeset
  precedent).
- No `flame.mjs`/agent CLI subprocess was spawned at any point; the
  only execution all session was `head`/`wc`/`grep`/`python3` over the
  7 MB preserved dump (sub-second text scans, no repo code executed).
  Every spawned-run gate held vacuously; census chain closed over:
  dump → site/shape/key census → arm mapping (keys2+posreuse+diag+repro)
  → call-site map → profile bounds → ceiling math.
- Grounding covered: VOYAGE.md + parent LOG.md wave-2 entries
  (read-only via absolute path: keys2 LAND-entry diet, scalarjson BANK,
  diag/canon2/cascade/parse landings, intbank sum, repro burndown,
  rooms/backlog/dead-ends incl. keys-memo CLOSED at both bars);
  scalarjson report + patch (same-function adjacency mapped);
  btreeset report (parent hypothesis); keys2 report (dump method +
  phase bar); posreuse 3× structure; repro report (rooms + dry list);
  agent-rs skill.
