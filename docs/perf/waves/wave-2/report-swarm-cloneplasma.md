# REPORT: swarm-cloneplasma — clone-plasma census → combined diet

## Verdict

**LAND (whole-sync: median Δ −23.07 ms / −2.09%, 6/8 pairs favor, ex-run-1 −24.85, paired-median −24.92 — clears both the ≥15 ms and the ≥1.5% prongs with all estimators agreeing)**

One line: censused every live String/Box clone site (89,904 wants, key built 89,904× used 0×, collapse 100% plain, 16,239 dup key-clones), killed the dead plasma as one 6-site combined diet (5 files, +121/−32), and landed −23 ms whole-sync with 4-scale sealed-pin byte-identity.

## Base / binaries

- Base commit: `0a5731681c2bca56578d80ed67934e3ea709593a` (verified `git rev-parse HEAD` before any work; post set-2 tip: hashers+extract LANDED — cited, never redone).
- Base `.node` sha256: `1a55b0d2b4a91e1baa0e4c1050ccf59849c8100d89a05efb6400ab15abcc353f` (built in-tree from clean base, asided to `/tmp/swarm-cloneplasma-base.node`, hash re-verified after every restore).
- Candidate `.node` sha256: `758e82482d11dcdd29ee6c3ea534c8eaa7b2bc9ee1a9b43d2043d678d0dc89f0` (`/tmp/swarm-cloneplasma-cand.node`, 18 pre-existing warnings, zero new).
- Census `.node` sha256: `ab57c0b6e804…` (counts only, never timed).
- Binary discipline: sha-verified before every one of 52 runs (ab.sh/ident.sh refuse on mismatch); final after-check confirmed cand in-tree, then base restored.
- `git diff --stat`: 5 diet files only (untracked: this REPORT.md; bench-report byproduct dir removed).

## Mechanism counts (enterprise seed-7 load, 7527 css calls)

Temporary env-gated dump (`SWARM_CLONEPLASMA_DUMP`, 12 site tags, fully reverted). Raw dumps at `/tmp/swarm-cloneplasma-count{1,2,3}.err`: **356,841 lines ×3, byte-identical** (sha `b0764a59…`).

| site | count | split |
| --- | --- | --- |
| wants (`resolve_want_with` entries) | 89,904 | extract-stream (file) 57,623 / builder-stream 32,281 |
| want when-len | 89,904 | 0: 29,577 · 1: 44,377 · 2: 12,796 · 3: 3,154 (conditioned 60,327; 79,431 steps; 381,475 B) |
| prop bytes | 760,915 B total | avg 8.46 B/want |
| rejections (key USES) | **0 / 0 / 0** | unknown-prop / unknown-cond / unrealizable — key built 89,904×, used 0× |
| macro hits | 0 | font/weight/container/size/gradient/border-owned all dead on bench |
| pairs / atoms per want | 1 / 1, ALL | every want yields exactly one pair and one atom |
| clean_when len | 89,904 | 0: 42,367 · 1: 34,891 · 2: 10,692 · 3: 1,954 (non-empty 47,537; 62,137 whens; 312,299 B) |
| collapse calls / plain | 89,904 / **100%** | 523,765 B total, avg 5.83 B — every string is already collapsed |
| unit_px (`{num}px`) | 16,276 | len1: 3,347 · len2: 7,378 · len3: 5,551 |
| build path | diet=true, 35,426 decls | full `build()` never called on bench |
| decls dup / ok / empty | 16,239 / 19,187 / **0** | keylen avg 56.7 B (dup) / 73.4 B (ok); zero failed decls |
| authored (object/mod) values | 35,426, all 1 | whenlen 0: 26,236 · 1: 6,790 · 2: 2,400 (conditioned 9,190) |
| authored (entries const path) | **0** | const-object lowering dead on this load |

Cross-validation (independent crews, same load): authcss pin-stream census — 89,904 wants, keyuse ZERO, collapse 100% noop, 0 refusals (headline counts identical); resolvefmt — 16,276 unit_px with the exact 3347/7378/5551 split; shorthand — 89,904 expand calls; wave-1 keys — 35,426/19,187 exact.

Stream note (method finding): the census ran with `--seed 7`, which renames the plan to `enterprise+custom` and draws a **different value stream** (same counts, different bytes: `b59d073a…` vs pin `7ec827fb…`). Counts transfer across streams (proven by the cross-validations above); timing and identity below run on the pin stream (no `--seed`, authcss/intset2 protocol).

## The diet (6 sites, one combined sum)

All in `packages/reference-rs/modules/atomic/src/`:

- **R1 — lazy `authored_key`** (`resolve/mod.rs`, `resolve_want_with` + `lower_conditions`): the per-want `OwnedLookupKey` (system String + prop String + when `Vec<Box<str>>` deep clone + `atom_value_to_json`) was built eagerly and dropped on the happy path (census: 0 uses). Now built inside the two rejection arms only; `lower_conditions(want, session)` builds it in the `Unknown` arm. `session.want`/`session.location` stay eager (live mid-resolve readers in unit/tokens). Kills ~3 String allocs + ~1.3 Box clones per want × 89,904.
- **R2 — `clean_when` move-first** (`resolve/mod.rs`, new `push_resolved_atoms` helper): first successful atom moves the lowered `SmallVec<[When; 2]>`, later ones clone the first atom's identical copy (extracted to a helper so `resolve_want_with` keeps baseline complexity). Kills 1 When-vector deep clone per want-with-atoms (47,537 non-empty × ~2.5 boxes).
- **R3 — `unit_px` exact-push** (`resolve/unit.rs`, `resolve_numeric_value`): `format!("{s}px")` → `with_capacity(len+2)` + 2 pushes (resolvefmt's filed filler, cited). 16,276 calls.
- **U1 — collapse borrowed fast path** (`resolve/normalize.rs` + `unit.rs`): new `collapse_whitespace_cow` (byte-exact: ASCII structural WS is only `0x09–0x0D`+space per lexical L1, all other members ≥U+85 i.e. bytes ≥0x80; quotes `"'`) + `collapse_boxed` reusing the input box on the plain path. 89,904/89,904 plain → zero alloc. Pinned by a new differential test incl. VT/0x0B, NEL, NBSP, U+3000 edges.
- **B1 — `seen_keys` probe-then-decide** (`runtime/builder.rs`, `build_keyed`): borrowed `contains` skip for dups (16,239 × 56.7 B clones gone), move-owned-into-set on failed decls (same skip-next behavior, zero clone), single clone only on success (set + carried keys both need owned). Seen-set contents provably identical; pinned by the existing `build_with_keys`/`build_diet` tests.
- **E1 — `when_strings` move-last** (`extract/expressions/object/mod.rs`, `handle_known_style_prop`): single-value props (all 35,426) move the condition stack instead of build+clone+drop. Saves 9,190 conditioned Vec deep clones.

Deliberately excluded (surveyed with reason): E2 const-path (0 calls, dead); builder `when_boxed` ×3 (realloc D-rbox ground — and realloc wall-proved `Box::from` slower, reverted); `lower_when`/includes/sources/`normalize_str` (realloc fences); `JsxHosts` union (extract landed); `wire.rs`/`native.rs` (marshal landed); analyzer exports iteration (hashers exclusion); `render.rs` (proof landed); `format_entry` (modgraph CUT room); `serializer.rs` (scalarjson pending re-proof); `shorthands/*` (shorthand landed); `push_want` origin/file (output-observable under proof=true); walk `when.clone`s (necessary owned copies from borrowed source).

## 8-pair A/B (verdict set, pin stream)

Warmups (unscored): base 1113.16, 1117.96; cand 1100.24, 1087.16. Interleaved pairs, alternating order:

| pair | base syncMs | cand syncMs | Δ ms | order |
| --- | --- | --- | --- | --- |
| 1 | 1096.92 | 1085.09 | −11.83 | B,C |
| 2 | 1099.38 | 1124.47 | +25.09 | C,B |
| 3 | 1098.87 | 1100.75 | +1.88 | B,C |
| 4 | 1106.41 | 1083.89 | −22.52 | C,B |
| 5 | 1116.39 | 1075.45 | −40.94 | B,C |
| 6 | 1110.18 | 1081.56 | −28.62 | C,B |
| 7 | 1109.40 | 1079.76 | −29.64 | B,C |
| 8 | 1105.18 | 1077.86 | −27.32 | C,B |

- Base median 1105.80; cand median 1082.73; median Δ **−23.07 ms (−2.09%)**, **6/8 favor**.
- Ex-run-1: Δ **−24.85 ms** — stands. Paired-median: **−24.92**. All three estimators agree.
- P2c (1124.47) is a slow-cand box outlier (mirror of crews' documented outliers); medians robust. cssCalls 7527 and bundle bytes pin-exact on all 20 runs.

Discarded set (disclosed, non-protocol stream): the first 8-pair ran with `--seed 7` (+custom stream): medians −25.39 ms, 8/8. It favors the diet, so discarding it is conservative; it is not part of the verdict.

## Identity, determinism, suites, quality

4-scale byte-identity, base vs cand, both arms vs sealed pins (full 64-char verified):

| scale | styles.css (both arms) | runtime-data.mjs (both arms) |
| --- | --- | --- |
| enterprise | `7ec827fb…e10dcea` (2,867,925 B) ✓ pin | `718d19e4…378918` (214,466 B) ✓ pin |
| small | `ecdec1e8…bda2973` (92,651 B) ✓ pin | `ad9194f4…e994d41` (91,030 B) ✓ pin |
| medium | `37f2ef5b…04819fe` (348,780 B) ✓ pin | `54735e4d…08cfe7ce` (110,241 B) ✓ pin |
| churn | `1aad4978…deb10ec05` (8,289,806 B) ✓ pin | `e1349305…f70103f18cdb` (103,709 B) ✓ pin |

Determinism: 29/29 pin-stream runs pin-consistent (8 full-sha identity + 20 A/B bundle-byte + 1 no-seed probe); +custom stream likewise self-consistent (b59d073a…).

- Suites: `cargo test -p atomic` **572 lib + 1 integration, 0 failed** (base 571+1; delta is exactly the new Cow test).
- Quality: `pnpm agentrs q` on all 5 diet files — **0 violations, 1 warning** (builder.rs file length, verified pre-existing on HEAD versions; 2 introduced complexity warnings were fixed by extraction, not suppression). Diet lines fmt-clean (remaining `fmt --check` hunks all pre-existing).

## Euclid-style mechanism proof

What the census counts removed, summed (allocs + paired frees + memcpy):

1. R1 removes per want 3 tiny Strings (system ~3 B, prop 8.5 B avg, value 5.8 B avg) + per conditioned want 1 Vec + 1.32 Box steps: ≈ 270k String + 60k Vec + 79k Box allocs ≈ **410k allocs** (+410k frees).
2. R2 removes 47,537 non-empty When-vectors ≈ **140–155k Box** allocs (+frees).
3. U1 removes 89,904 String builds + shrinks ≈ **90k allocs** (+90k frees).
4. R3 removes 16,276 format+realloc pairs ≈ **16k allocs + 16k reallocs**.
5. B1 removes 16,239 × 56.7 B key clones ≈ **16k allocs** (+frees), costing 35,426 borrowed probes.
6. E1 removes 9,190 conditioned Vec deep clones ≈ **9k Vec + 12k Box** allocs.

Total ≈ **700k+ alloc/free pairs + ~2 MB memcpy** removed, zero added work (probes + byte scans only). At the measured tiny-alloc all-in cost (~30–40 ns), the counted ceiling predicts ≈ 20–30 ms; the 8-pair measures **−23.07 / −24.92 / −24.85** with all estimators inside the predicted band. The sum — not any site — bars: the largest single site (R1) is itself near-bar, and the six together clear both prongs. Q.E.D.

## Collision / race notes (for the captain)

- **authcss (BANK −11.60/−1.12%, 8/8, same base): OVERLAP, mine subsumes.** Their 3 diet files (`resolve/mod.rs`, `resolve/normalize.rs`, `resolve/unit.rs`) are a strict subset of my 5, covering the same R1/R3/U1 mechanisms (verified from their filed patch headers, not their tree); my diet adds R2 + B1 + E1 and measures −23.07 on the same protocol. Per first-sound-LAND-wins, take these lines from this diet; theirs rebases to nothing or drops. (I never touched their worktree; overlap inferred from filed artifacts + claims only.)
- **Set-3 (LAND 3dd32a65, mid-mission): DISJOINT.** collect (sources/includes), proof (render/memo), selpush (name/escape/nesting), shorthand (shorthands/*), marshal (wire/native/runtime.ts) touch none of my 5 files — clean rebase expected.
- **Fences respected:** realloc scan-side + when guards (incl. staying out of the reverted D-rbox sites), extract union, marshal codec, hashers exports exclusion, proof render, sortshape (zero emission-order changes — identity proves it).
- Follow-up filed, not taken: `WantContext` borrow diet (kills the remaining 79,431 session.want Box clones, ≈3–5 ms) — needs a pub-API lifetime; kept out to hold this diet sound-minimal under race pressure.
