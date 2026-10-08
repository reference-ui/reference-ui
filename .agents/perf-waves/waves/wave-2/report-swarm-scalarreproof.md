# REPORT: swarm-scalarreproof — scalar fast frame re-derived on the landed generic signature (BANK)

## Verdict

**BANK (generic fast frame: +0.24 ms phase marginal vs the LANDED keys2 diet,
6/7 process runs favor, proven-identical across all three live `W` over
≈1.09M differential checks with 0 divergences, 4-scale byte-identity vs
sealed pins; whole-sync effect unresolvable as predicted — not chased)**

One line: the `WhenSteps` step-iteration trait composes the banked five-tuple
frame with the generic signature at zero measurable abstraction cost (generic
mean +0.24 ms vs banked concrete mean +0.25 ms) — the HELD set-2 member is
re-proven natively on the landed base.

## Base

- Base pin: `0a5731681c2bca56578d80ed67934e3ea709593a` (verified
  `git rev-parse HEAD` before any work; tree clean at start; post set-2 tip,
  keys2 LANDED).
- Base `.node` sha256:
  `92ea12064ae71b744f7253e090a0ffdbba0709d4d91492033e78acdb5940509d`
- Candidate `.node` sha256:
  `8606af8f3f3d50fe99cd445f1db23bdb771789e0417827116b822fd37ea0512f`
  (deterministic: forced rebuild reproduces the sha exactly)
- Count `.node` (diet + temporary env-gated census, reverted after): `ac23f9cd…`
- All three binaries `cp`-saved aside (`/tmp/swarm-scalarreproof/*.node`); arms
  swapped by file copy, never rebuilt mid-set; sha256 verified before AND after
  every run (18/18 `ok`).
- Current tree `.node` = candidate build (left after A/B).

```
git diff --stat (tracked)
 .../modules/atomic/src/runtime/serializer.rs | 240 +++++++++++++++++++--
 1 file changed, 228 insertions(+), 12 deletions(-)
new: packages/reference-rs/modules/atomic/tests/serializer_parity.rs (247 lines)
new: REPORT.md (this file)
```

## Why this is new work, not a merge (grounding)

The banked scalarjson patch (`scalarjson.patch`) is concrete over `LookupKey<'_>`
(default `W = [String]`, patch line 44): `write_scalar_tuple` iterates
`key.when` as strings. LANDED keys2 generalized the signature to
`LookupKey<'a, W: ?Sized>` (`serializer.rs:37`) with THREE live instantiations:

- `W = Vec<String>` — the hot plan-builder path (`builder.rs:33-39`,
  `when: &self.when`; the same source line inferred `W = [String]` on the old
  base via deref coercion, so landed keys2 silently re-instantiated even the
  hot call site);
- `W = [Box<str>]` — owned keys (`facts.rs:33-39`, `when: self.when.as_slice()`);
- `W = [String]` — tests (`LookupKey::new`).

The banked writer cannot serve the first two without a step-iteration
abstraction present in neither patch, and the banked fuzz never exercised
`[Box<str>]` steps. Per `integrate-set2.md`: HELD, re-proof required —
re-derive the fast frame natively on the generic signature covering all live
`W`, differential-fuzz every instantiation, re-run the phase-bench marginal
vs the LANDED diet.

## Abstraction design

**`WhenSteps`: a step-iteration trait, not restructured bounds.**
`serialize_lookup_key` keeps landed keys2's structure and extends its bound
from `W: serde::Serialize + ?Sized` to `W: serde::Serialize + WhenSteps + ?Sized`:

```rust
pub trait WhenSteps {
    fn steps(&self) -> impl Iterator<Item = &str>;
}
impl WhenSteps for [String] { ... self.iter().map(String::as_str) ... }
impl WhenSteps for Vec<String> { ... self.iter().map(String::as_str) ... }
impl WhenSteps for [Box<str>] { ... self.iter().map(|step| &**step) ... }
```

Design notes (filed for the captain):

- The serde fallback keeps its own bound and its landed body verbatim; the
  trait serves only the hand writer. Fences honored: keys2's serializer
  structure extended, not redesigned; hashers' Fx types untouched (no hasher
  file in this diff); zero order changes — same bytes, same sequences
  (sortshape bar intact, proven by byte-identity below).
- The frame fn is generic over `W: WhenSteps + ?Sized`; only its two
  `when`-iteration lines differ from the banked concrete writer
  (`key.when.steps()` in place of `key.when` / `key.when.iter()`), and all
  byte-emitting helpers (`push_json_string`, escape tables, scalar renderers)
  are shared, not monomorphized — the banked dead-end (closure-monomorphized
  frame 0.07–0.23 ms SLOWER, inline-budget tip) is structurally avoided: the
  frame monomorphizes 3× over tiny iterator adapters while every byte-emitting
  helper stays a single named copy. The phase bench below confirms the
  abstraction costs nothing measurable.
- A pure-bounds alternative (`for<'x> &'x W: IntoIterator` with
  `Item: AsRef<str>`) was considered and rejected: opaque errors for a future
  fourth `W`, and the whole design would hinge on `Box<str>`'s `AsRef<str>`
  standing. The named trait names exactly the three live instantiations and
  fails loudly on any other.
- The scalar branch subsumes keys2's scalar-borrow (per the crews' collision
  note); the container fallback is the landed diet body textually verbatim,
  hence identical by construction. The stacking-relevant marginal is the
  measured diet−fast delta below, NOT legacy−fast.

## Per-instantiation census (counts-first)

Method: wave-1's site-tagged dump (`SWARM_KEYS_DUMP`, per-`serialize_lookup_key`
call) is preserved at `/tmp/swarm-keys-dump-ent.txt` (106,278 lines); its filed
cross-check reads "no untagged (`?`) serializations appeared in the dump, so
decl + exact are the complete bench-path key volume" with reject/sink/other = 0.
Site → `W` mapping is mechanical: both wrappers are the only production callers
(grep-closed over every crate, bench, and example — no other
`serialize_lookup_key` caller exists), and each wrapper fixes its `W`:

- decl → `AuthoredDeclaration::lookup_key` (`builder.rs:34`) → `W = Vec<String>`;
- exact → `OwnedLookupKey::lookup_key` (`facts.rs:33`) → `W = [Box<str>]`.

Set-1/set-2 landed since the wave-1 instrument, so the census was re-verified by
a count run on THIS base (temporary env-gated tag-per-call in the two wrappers,
one enterprise run, instrumentation reverted after):

| W | production site | wave-1 filed | count run (this base) |
| --- | --- | --- | --- |
| `Vec<String>` | plan-builder decl loop | 35,426 | **35,426** |
| `[Box<str>]` | owned-key exact loop | 70,852 | **35,426** |
| `[String]` | tests only | 0 | 0 (static: no production caller) |
| live total | | 106,278 | **70,852** |

**Finding: the exact loop halved since wave-1** (70,852 → 35,426). Cause: landed
set-1 diag, which "removes some `lookup_key` calls entirely"
(`integrate-bank.md`) — the surviving exact volume is one serialization per
expected fact, and the preserved corpus dump's exact block (2× decl, positionally
identical halves per the keys2 report) now represents 2× the live exact volume.
The phase bench below drives the full corpus (method-comparable to the banked
numbers) AND scales the marginal to the live 70,852 for the verdict math.

## Differential fuzz (fast frame vs LANDED diet, per W)

Oracle in every test: the landed-diet body (canonicalize containers, borrow
scalars, serde tuple) kept as a generic `serde_tuple_diet<W: Serialize>` —
NOT legacy. Every committed check runs under ALL THREE live `W` and both
`important` parities (6 arms per case).

| suite | checks | divergences |
| --- | --- | --- |
| unit smoke (`serializer.rs`): scalar case × 3 W vs oracle | 3 | 0 |
| integration scalar fuzz (seeded xorshift, escape-heavy pieces) | 30,000 × 6 = 180,000 | 0 |
| integration container fuzz (nested shapes, key-order variants) | 5,000 × 6 = 30,000 | 0 |
| when-steps every-byte-value (256 × 4 placements × 2 frames × 6) | 12,288 | 0 |
| scalar-value every-byte-value (same shape) | 12,288 | 0 |
| adversarial (empty/long-8KB/C0-soup/tangles/unicode/U+2028/9 numbers/4 containers, escape-heavy steps) | 25 × 2 × 6 = 300 | 0 |
| phase-harness corpus parity (REAL 106,278 tuples, fast vs diet vs legacy, 8 process runs) | 8 × 106,278 = 850,224 | 0 |
| **total** | **≈1,085,000** | **0** |

The banked gap is closed explicitly: `[Box<str>]` steps now carry escape edges
(C0 soup, quote/backslash tangles, empty steps) in the adversarial suite, the
every-byte steps matrix, and 90,000 fuzz tuples' steps — the banked fuzz only
covered `[String]`.

## Phase bench (frame vs LANDED keys2 diet, per W)

Protocol (keys2/scalarjson method): REAL functions over the REAL enterprise key
corpus (106,278 tuples in call order), decl lines constructed as `Vec<String>`
keys and exact lines as `[Box<str>]` keys per the production mapping above.
Three arms — `legacy_like` (verbatim pre-change ops, method validation),
`diet_like` (verbatim landed-diet ops, harness-local), `fast` (the real new
`serialize_lookup_key`) — 2 unscored warmups + 25 scored interleaved rounds
with rotated arm order, medians; SEVEN independent process runs on the diet
tree (temporary example harness, reverted after numbers).

Harness-fidelity proof (beyond the banked method): the harness ALSO ran once on
the pristine base tree, where `serialize_lookup_key` IS the landed diet — the
fast(base)==diet_like parity assertion over all 106,278 tuples (0 divergences)
proves the harness-local `diet_like` copy equals landed behavior, so every
diet−fast marginal below is measured against a proven-faithful reference, not
a copy on faith. That base run also files the instrument's placement-noise
floor: two textually-different copies of the SAME ops measured +0.11 ms apart
(21/25) — marginals near ±0.1 ms are noise, and the verdict requires clearing it.

Method validation: legacy over the corpus measures 17.31–18.14 ms across the
8 runs vs the filed 17.3–18.3 ms band and 19 wt flame weight — the corpus
method reproduces the independent instruments. Corpus shape census re-verified
by parsing: 82,458 scalar-frame + 23,820 container-fallback, exactly the filed
counts.

Combined block (106,278 tuples), diet−fast marginal per process run:

| run | legacy ms | diet ms | fast ms | diet−fast (medians) | diet−fast (paired mean±sd) | favor |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 17.45 | 15.77 | 15.74 | +0.04 | +0.14 ± 0.26 | 15/25 |
| 2 | 17.39 | 15.74 | 15.44 | +0.30 | +0.29 ± 0.14 | 23/25 |
| 3 | 17.61 | 15.89 | 15.49 | +0.40 | +0.31 ± 0.19 | 21/25 |
| 4 | 17.31 | 15.69 | 15.76 | −0.07 | −0.08 ± 0.15 | 4/25 |
| 5 | 17.64 | 15.96 | 15.60 | +0.37 | +0.41 ± 0.23 | 25/25 |
| 6 | 18.14 | 16.59 | 16.29 | +0.31 | +0.32 ± 0.35 | 25/25 |
| 7 | 17.59 | 15.92 | 15.58 | +0.35 | +0.36 ± 0.12 | 25/25 |
| **mean** | | | | **+0.24** | **+0.25** | **6/7 runs** |

Per-W diet−fast (medians-diff / paired favor), same runs:

| run | decl `Vec<String>` (35,426) | exact `[Box<str>]` (70,852) |
| --- | --- | --- |
| 1 | +0.03 / 13/25 | +0.06 / 18/25 |
| 2 | +0.06 / 22/25 | +0.26 / 25/25 |
| 3 | +0.08 / 20/25 | +0.32 / 24/25 |
| 4 | −0.05 / 1/25 | +0.01 / 10/25 |
| 5 | +0.09 / 23/25 | +0.27 / 25/25 |
| 6 | +0.10 / 21/25 | +0.26 / 25/25 |
| 7 | +0.08 / 24/25 | +0.25 / 25/25 |
| **mean** | **+0.06 (6/7 positive)** | **+0.20 (7/7 positive)** |

Per-tuple diet/fast means: 150.0 / 147.7 ns (≈2.2 ns saved). Fast-vs-legacy is
rock-solid in every run and block (+1.55…+2.12 ms combined, 25/25 everywhere) —
the frame mechanism is real; the diet−fast delta is its small remainder.

Reading (filed honestly, both estimators):

- The generic frame's marginal (+0.24 ms mean, 6/7 runs favor) reproduces the
  banked concrete frame's marginal (+0.25 ms mean, 7/8 runs favor) within run
  noise — **the `WhenSteps` abstraction costs nothing measurable**. The one
  contra run (−0.07) mirrors the banked replication's one contra (−0.07); the
  base-tree control (+0.11 for identical code) shows ±0.1-scale run noise is
  inherent to this instrument, and 5 of 7 runs clear it by 3×+.
- The win concentrates on `[Box<str>]` (+0.20, positive in all 7 runs) with
  `Vec<String>` weakly positive (+0.06, 6/7). No mechanism claimed for the
  split beyond the numbers (candidate causes: per-monomorphization codegen,
  block-order cache effects — out of scope; the frame wins on BOTH live
  production `W`, which is what the verdict needs).
- Live-volume scaling (the verdict math): 70,852 live serializations
  (35,426 per production `W`, count-verified) × ≈2.2 ns mean saved ≈
  **+0.16 ms live phase estimate**. Corpus-scale mean (+0.24 ms) is the
  method-comparable figure; live-scale (≈+0.16 ms) is the honest prize.
  Both are positive; neither resolves whole-sync (disclaimed below).

## Identity (base vs cand, all 4 scales vs sealed pins)

`styles.css` + `runtime-data.mjs` `cmp` base-vs-candidate per scale; every hash
vs the sealed wave-1 pins (enterprise full strings verified
character-for-character; other scales prefix + exact byte size). `cssCalls`
7527 on the count run; bundle sizes exact everywhere.

| scale | styles.css (both arms) | runtime-data.mjs (both arms) |
| --- | --- | --- |
| enterprise | `7ec827fb…e10dcea` (2,867,925 B) | `718d19e4…378918` (214,466 B) |
| small | `ecdec1e8…a2973` (92,651 B) | `ad9194f4…4d41` (91,030 B) |
| medium | `37f2ef5b…19fe` (348,780 B) | `54735e4d…fe7ce` (110,241 B) |
| churn | `1aad4978…ec05` (8,289,806 B) | `e1349305…cdb` (103,709 B) |

Full strings (both arms identical): enterprise
`7ec827fb0c0cf6856f12fe9557f977505ec745b57ef8d8a62ed46df05e10dcea` /
`718d19e470176b97350c576ef79566f659d6db85253b66b0bb7a2b19b7378918`;
small `ecdec1e80f8e71a8…bda2973` / `ad9194f41181aaee…e994d41`; medium
`37f2ef5b43f8b7cb…04819fe` / `54735e4d5a51c567…08cfe7ce`; churn
`1aad4978ffdc1ba1…deb10ec05` / `e134930586eb56a5…f70103f18cdb`.
Determinism: enterprise at the sealed pins across all three binaries
(count/instrumented+diet, base, cand); base==cand `cmp`-identical on all
four scales (8/8 files).

## Suites + quality

- `pnpm agentrs c atomic` on diet tree: **572 unit + 1 harvest + 5 parity
  passed, 0 failed** (incl. 1 new unit smoke + 5 new integration tests);
  stash-compared on base tree: 571 + 1, 0 failed — delta is exactly the 6
  new tests, zero other movement.
- `pnpm agentrs q` on both diet files: **0 violations, 0 warnings**.
- No wrappers touched; no other crate calls the changed function (grep-closed,
  incl. benches and native).
- Whole-sync A/B: NOT RUN — the brief sets phase proof + identity as the bar
  and explicitly disclaims whole-sync resolution for a ≈0.2 ms effect under
  ±20–100 ms scan noise (the scalarjson/keys2 precedent, same disclaimer at
  the same ratio). No LAND claim is made or implied. The phase marginal above
  (+0.24 ms corpus / ≈+0.16 ms live) is the win evidence.

## Collision notes

- keys2-LANDED: composed, not collided — the diet's container fallback is
  keys2's body verbatim; the scalar-borrow arm is subsumed by the frame with
  the double-claim disclosed (stacking marginal = diet−fast only, measured
  above against the LANDED diet, not legacy).
- posreuse/cascade/hashers/realloc/diag: no shared functions with this diff
  (serializer.rs + new test file only). Noted interaction (no collision):
  landed diag halved the live exact volume (70,852 → 35,426), which scales
  this change's live prize to ≈+0.16 ms — filed in the census, not hidden.

## Housekeeping notes

- Temporary phase harness (`modules/atomic/examples/`, 8 timed runs) and
  temporary count instrumentation (1 run) fully reverted; final tree diff is
  exactly the 1 modified + 1 new file above plus this REPORT.md (untracked).
- `packages/reference-neo/benchmark/reports/latest/*` bench-output churn
  reverted (regenerable live state, not part of the deliverable).
- No commits, no pushes — the captain lands.

## Verdict

**BANK (generic scalar fast frame: +0.24 ms phase marginal vs the LANDED
diet, 6/7 runs favor with paired +0.25, wins on both live production `W`,
0 divergences over ≈1.09M differential checks, 4-scale byte-identity vs
sealed pins, suites + quality green)**
