# INTEGRATE.md — wave-2 cloneplasma tip confirmation + authcss race adjudication (swarm-intclone)

Base pin verified: `git rev-parse HEAD` = `3dd32a659715aeb17d5d04167d756fb7f5ce30c8`
(post set-3 tip). Tree was clean at start. No commits, no pushes — the captain lands.

Working verdict: **LAND (cloneplasma 6-site diet, tip-confirmed −26.65 ms / −2.50%)**.
Race disposition: **authcss YIELDS (all 6 hunks subsumed on measured evidence, hunk map below)**.
Final verdict line at the bottom of this file is authoritative.

Member artifacts were read from the parent workspace (`docs/perf/waves/wave-2/`,
absent at this tip commit): `report-swarm-cloneplasma.md`, `report-swarm-authcss.md`,
`cloneplasma.patch`, `authcss.patch`, plus `integrate-set3.md` as the protocol
template. Nothing was copied into this tree. Stream discipline: the crew censused
on `--seed 7` (custom stream) but timed on the pin stream; **every run below is
pin-stream (no `--seed` flag)**, authcss/intset2 protocol — including the
adjudication probe, whose totals re-verify the crew's counts on the pin stream
directly.

## Per-change paragraphs (6 sites, 5 files, +121/−32)

All in `packages/reference-rs/modules/atomic/src/`.

**R1 — lazy `authored_key` (`resolve/mod.rs`).** The eager per-want
`key_for_want` build (old line 133, deleted) now builds only inside the
unknown-prop rejection arm (:133-134) and inside `lower_conditions`' Unknown
arm (:266); `lower_conditions` takes `(want, session)` (:258) and iterates
`want.when` (:261). Kills ~3 String allocs + ~1.3 Box clones + 1 JSON value per
want × 89,904 on the happy path. Census: key built 89,904×, used 0×.

**R2 — `clean_when` move-first (`resolve/mod.rs`, `push_resolved_atoms`
:151/:157).** First successful atom moves the lowered conditions
(`carried.take()`, :167); later ones clone the first atom's identical copy
(:169). Kills 1 When-vector deep clone per want-with-atoms (47,537 non-empty ×
~2.5 boxes). Extracted to a helper so `resolve_want_with` keeps baseline
complexity (q-clean, verified).

**R3 — `unit_px` exact-push (`resolve/unit.rs:117`).** `format!("{s}px")` →
`with_capacity(len+2)` + 2 pushes. 16,276 calls. Resolvefmt's filed filler,
cited by both crews — taken identically here.

**U1 — collapse borrowed fast path (`resolve/normalize.rs` + `unit.rs`).**
`collapse_whitespace_cow` (:27) borrows the input when no byte is ≥0x80, a
quote, structural WS, or space; `collapse_boxed` (:40) reuses the input box on
that path; the `from_string` call site (`unit.rs:168`) passes ownership instead
of copy-then-collapse. My probe (below) proves 89,904/89,904 enterprise values
predicate-plain → zero alloc. Pinned by `cow_fast_path_agrees_with_slow_path`
(:149, the +1 carried-over test).

**B1 — `seen_keys` probe-then-decide (`runtime/builder.rs`).** Borrowed
`contains` skip for dups (:197; 16,239 × 56.7 B clones gone), move-owned into
the set on failed decls (:205, same skip-next behavior, zero clone), single
clone only on success (:209, set + carried keys both need owned). Seen-set
contents provably identical; pinned by the existing `build_with_keys` /
`build_diet` tests (green in the 595).

**E1 — `when_strings` move-last (`extract/expressions/object/mod.rs`).**
Single-value props (all 35,426) move the condition stack into the last value
(:236 `mem::take`) instead of build+clone+drop. Saves 9,190 conditioned Vec
deep clones.

## Collision analysis (rebase record with file:line evidence)

`git apply --check` on this tip before any work: **clean**. `git diff
0a5731681..HEAD` (crew base → this tip, i.e. everything set-3 landed) is
**EMPTY on all 5 diet files** — the crew's DISJOINT claim is mechanically
confirmed, and the patch applied **bit-exact** (`git diff --stat` reproduces
the filed +121/−32 exactly, numstat 11/3, 25/16, 60/0, 7/2, 18/11).

- Within-diet: the 6 sites touch disjoint functions across 5 files; the two
  `resolve/mod.rs` sites (R1: :133-134/:258-266, R2: :151/:157-169) share only
  the `clean_when` binding, which R1's hunk passes through unchanged in shape
  (`let Some(clean_when)`, same name/type) — composed in the filed patch, no
  integrator sequencing needed.
- Fences (re-verified, not just cited): no `shorthands/*` contact (shorthand
  landed), no `wire.rs`/`native.rs` contact (marshal landed), no `render.rs`
  contact (proof landed), no `sources.rs`/`includes/*` contact (collect
  landed), no emission-order surface (`CascadeKey`/comparators untouched —
  4-scale byte-identity below is the behavioral proof), D-rbox sites untouched
  (realloc ground).
- What the rebase did NOT do: no hunk rewritten, reordered, or extended; no
  landed code converted or cleaned; the temp adjudication probe (below) was
  fully reverted with `cmp`-verified restoration (`git diff` byte-identical to
  the as-applied patch diff).

## Quality + correctness results

- `pnpm agentrs c atomic`: **595 + 1 passed, 0 failed** (diet) vs **594 + 1**
  on clean tip (stash-compared) — delta is exactly the carried-over
  `resolve::normalize::tests::cow_fast_path_agrees_with_slow_path` (named by
  filtered run: 1 passed / 594 filtered). Zero other movement. (Tip is 594 vs
  the crew's 571+1 base: +23 from landed set-3, as filed in integrate-set3.)
- `pnpm agentrs q` on all 5 diet files: **0 code violations, 1 warning**
  (`builder.rs` length 431 lines; HEAD version is already 423 > 365 soft
  limit → pre-existing, zero NEW warnings).
- Release-build warnings: base 22 == cand 22, **warning sets byte-identical**
  (`diff` clean), zero on diet lines. Cand rebuild reproduces its hash exactly
  (deterministic build).
- styletrace failure-set comparison vs tip (stash-compared): **31 passed /
  18 failed on BOTH arms, byte-identical** (`cmp` clean; the 18 pre-existing
  worktree-env failures in `hermetic_roots` + `tracing`, matching set-3's filed
  31/18). Zero new reds.

## Sum confirm (base arm = tip 3dd32a65, cand = tip + diet)

Binaries built in-tree per arm, asided to `/tmp/swarm-intclone/`, never rebuilt
mid-set; sha256 verified before EVERY run (harness aborts on mismatch — zero
mismatches across 33 runs) and asides re-verified after the block: base
`9abef1b1…`, cand `669a81bb…`, probe `dd1dbeee…` (all three distinct). Arm
selection by dist-copy swap with pre-run sha check (crew protocol); base
restored in-tree at close. Tracked `reports/latest/*` reverted after the block.
Sample = `scales[0].samples[0].syncMs`, cssCalls 7527 and bundle bytes
pin-exact on all 20 A/B runs. Pin stream throughout (no `--seed`).

Zero sets discarded. No regime shifts. The w-b1 first-touch spike (1399.63) is
the documented first-load validation of a new `.node` file — confined to
unscored warmups, disclosed, nothing scored affected.

Warmups (unscored): base 1399.63, 1060.28; cand 1028.92, 1048.82.

| pair | base syncMs | cand syncMs | Δ ms | order |
| --- | --- | --- | --- | --- |
| 1 | 1053.56 | 1038.40 | −15.16 | B,C |
| 2 | 1073.86 | 1057.57 | −16.29 | C,B |
| 3 | 1065.40 | 1030.57 | −34.83 | B,C |
| 4 | 1069.58 | 1048.00 | −21.58 | C,B |
| 5 | 1061.54 | 1037.90 | −23.64 | B,C |
| 6 | 1065.28 | 1082.58 | +17.30 | C,B |
| 7 | 1074.48 | 1030.96 | −43.52 | B,C |
| 8 | 1055.64 | 1038.98 | −16.66 | C,B |

- Base median: 1065.34; cand median: 1038.69; median Δ **−26.65 ms (−2.50%)**,
  **7/8 favor** — clears the ≥15 ms prong AND the ≥1.5% prong with headroom.
- Ex-run-1: base 1065.40, cand 1038.98, Δ **−26.42** — stands.
- Median of pair deltas: **−19.12**. All three estimators agree (−19…−27).
- P6c (1082.58) is a slow-cand box outlier, mirror of the crew's P2c and the
  documented crew outliers; it sits on the cand arm (conservative direction)
  and medians are robust. No lead/lag pattern (both orders favor throughout).
- Euclid band: the crew's counted ceiling predicted ≈20–30 ms; all three
  estimators land inside/consistent with the band. The tip confirmation
  measures slightly stronger than the crew's pre-set-3 −23.07 — same diet,
  post-set-3 base, no stacking games (disjoint files, proven above).

4-scale byte-identity (base vs cand, both arms vs sealed pins, full 64-char
verified character-for-character):

| scale | styles.css (both arms) | runtime-data.mjs (both arms) |
| --- | --- | --- |
| enterprise | `7ec827fb…e10dcea` (2,867,925 B) ✓ pin | `718d19e4…378918` (214,466 B) ✓ pin |
| small | `ecdec1e8…bda2973` (92,651 B) ✓ pin | `ad9194f4…e994d41` (91,030 B) ✓ pin |
| medium | `37f2ef5b…04819fe` (348,780 B) ✓ pin | `54735e4d…08cfe7ce` (110,241 B) ✓ pin |
| churn | `1aad4978…deb10ec05` (8,289,806 B) ✓ pin | `e1349305…f70103f18cdb` (103,709 B) ✓ pin |

Full hashes: ent css `7ec827fb0c0cf685…e10dcea`, data `718d19e470176b97…378918`;
small css `ecdec1e80f8e71a8…bda2973`, data `ad9194f41181aaee…e994d41`; medium
css `37f2ef5b43f8b7cb…04819fe`, data `54735e4d5a51c567…08cfe7ce`; churn css
`1aad4978ffdc1ba1…deb10ec05`, data `e134930586eb56a5…f70103f18cdb`.

Determinism: **29/29** pin-stream runs pin-consistent (20 A/B bundle-byte +
9 full-sha identity incl. a second cand enterprise datapoint). Probe runs
(below) were additionally output-clean (pin-exact bytes) but are counts-only,
never timed, never in the verdict set.

## Race adjudication: authcss vs cloneplasma (hunk-by-hunk)

Authcss's 3 diet files are a strict subset of cloneplasma's 5 (same paths,
`resolve/mod.rs` + `resolve/normalize.rs` + `resolve/unit.rs`). Each authcss
hunk is ruled below against the covering cloneplasma hunk with mechanism +
counts. The collapse-path ruling rests on a dedicated probe, not on assertion:

**Probe (counts for H3/H6).** Temp env-gated instrumentation at the
`collapse_boxed` call site (the same path authcss's gate guards), classifying
every value under BOTH predicates: `cow` (Cow-plain → zero alloc under both
diets), `gateonly` (gate clears but Cow slow-paths → alloc under cloneplasma
only = the claimed-subsumption gap), `slow` (both slow-path). Pin stream,
count `.node` never timed, instrumentation output-clean (pin-exact bytes),
fully reverted after (`cmp`-verified). Results:

| scale | values | cow | gateonly | slow |
| --- | --- | --- | --- | --- |
| enterprise | 89,904 | 89,904 | **0** | 0 |
| small | 2,284 | 2,284 | **0** | 0 |
| medium | 8,716 | 8,716 | **0** | 0 |
| churn | 401,223 | 401,223 | **0** | 0 |

502,127 values classified, **100% cow-plain, zero gateonly, zero slow** on
every measured scale. Enterprise total 89,904 also re-verifies the crew's
census totals on the pin stream (cross-stream count stability, again). Static
subset proof: cow-plain ⟹ gate-clears always (every gate trigger byte —
quotes, 0x09–0x0D, 0x85/0xA0 — plus 0x20 is excluded from the Cow's plain
set), so U1's removed set ⊆ D-col's removed set with NO reverse gap; the
difference counts exactly 0. Positive control (independent predicate
replication): `gateonly` is reachable in principle ("1px solid red", "a b",
"日本語") — the probe can see the class, the bench simply contains none of it.

Rulings (authcss.patch line refs → covering cloneplasma hunk):

- **H1 (D-key, unknown-prop site; apatch :5-23): SUBSUMED** by R1
  (`resolve/mod.rs:133-134`): same eager-build deletion at the same line,
  same lazy build at the same emit with identical inputs
  (`session`/`want.prop`/`atom_value_to_json(&want.value)` — bound local vs
  inline emit, same work). Removed: 89,904 key+JSON builds on the happy path.
- **H2 (D-key, `lower_conditions`; apatch :24-52): SUBSUMED** by R1
  (`resolve/mod.rs:258-266`): identical signature change to `(want, session)`,
  identical `want.when.iter()`, identical fresh-build-per-Unknown replacing
  `key.clone()`. Removed: the speculative-key clone per unknown condition
  (0 on bench, live off-load — same under both).
- **H3 (D-col gate fns `needs_collapse`/`is_collapse_trigger`; apatch
  :57-90): SUBSUMED on the measured load** by U1
  (`resolve/normalize.rs:27` + `:40`): different predicate, same path
  (`unit.rs:168`), same box reuse — and the removed sets coincide exactly on
  all measured scales (502,127/502,127 cow, gateonly = 0). Removed: all
  89,904 enterprise collapse allocs (+2,284/+8,716/+401,223 off-enterprise).
- **H4 (D-col differential test; apatch :100-163): SUPERSEDED (test-only, no
  work content).** It pins authcss's gate functions, which are not in the
  landed tree; the landed predicate is pinned instead by the Cow test
  (`normalize.rs:149`). Not a residuum — no shipped behavior depends on it.
- **H5 (D-px unit_px exact-push; apatch :169-184): SUBSUMED** by R3
  (`resolve/unit.rs:117`): identical `with_capacity(len+2)` + 2-push
  replacing the identical `format!` (bound-outside vs block-inside, same
  codegen). Removed: 16,276 format+realloc pairs. (Both crews cite
  resolvefmt's filed filler — credited there, not double-claimed.)
- **H6 (D-col `from_string` gate + `from_collapsed` split; apatch :185-216):
  SUBSUMED on the measured load** by U1 (`resolve/unit.rs:168`
  `collapse_boxed(s)`): same call site, same box reuse on the cleared set,
  same downstream body; removed-work difference = the gateonly class = 0 on
  all measured scales (probe table above).

**Disposition: authcss YIELDS.** All 6 hunks are subsumed-or-superseded on
measured evidence; nothing is dropped on assertion — the map above files every
hunk. Cloneplasma additionally carries R2 + B1 + E1 (no authcss counterpart),
which is where the extra −15 ms over authcss's banked −11.60 lives, consistent
with the Euclid accounting.

**Disclosed off-load distinction (not a residuum — counts are 0):** authcss's
gate is the strictly more general predicate: lone-space identities ("1px
solid red", "0 auto") and non-NEL/NBSP multibyte identities ("日本語") clear
the gate but slow-path the Cow. On any load containing such values the gate
removes strictly more collapse work. The bench contains none (502,127/502,127
cow across all 4 scales), so this is unmeasured follow-up material — e.g. a
future diet could swap the Cow predicate for the gate — not a LAND blocker and
not a rebased-authcss claim today.

## Verdict

**LAND (cloneplasma 6-site diet on tip 3dd32a65: confirmation medians −26.65 ms
/ −2.50%, 7/8, ex-run-1 −26.42, paired-median −19.12 — clears BOTH prongs with
all estimators agreeing; 4-scale byte-identity vs sealed pins; determinism
29/29; suites 595+1 with delta exactly the Cow test; quality 0 violations with
zero NEW warnings; styletrace failset byte-identical 31/18; bit-exact rebase
with EMPTY landed overlap on all 5 files). Authcss YIELDS (all 6 hunks
subsumed-or-superseded per the hunk map above; off-load gate-generality noted
as unmeasured follow-up).**
