# swarm-analysisb REPORT: analysis expectations diet (D1–D5)

## Verdict

**BANK (median Δ −0.64 ms / −0.06%, ex-run-1 −2.75 ms / −0.26%, per-pair median −3.06 ms; noise ±16 — sub-bar proven-identical diet with counted mechanism, cascade precedent)**

## Identity

- Base: `810b8b5b47448b4b99b688d9c2fda94c3ec9658e` (verified `git rev-parse HEAD` at start; tree clean).
- Base `.node`: `bd1813d4f059c3ce528ff9795f736dbde78fb84e16014b91a356f245192b9890`
  (8,871,920 B — same byte size as the re-profile build).
- Cand `.node`: `3b26d73a53a7e0249a44148ff305726a6ff858db8b7b6851216946c6d896ba7b`
  (8,879,192 B).
- Harness never rebuilt mid-set: both arms built once (base 04:04:45, cand 04:05:05),
  sealed aside to `/tmp/anab-{base,cand}.node`, all 30 bench runs + 2 differential
  runs via `REFERENCE_UI_NATIVE_PATH` arm selection (loader honors it as the sole
  candidate — contract test `loader.test.ts`; negative control with a bogus path
  fails with `Searched paths: /tmp/anab-no-such.node`). Post-block re-verify: worktree
  `dist` `.node` still the cand bytes (`3b26d73a…`).
- No commits, no pushes. End state: 9 diet files modified; `dist/` gitignored;
  bench-report byproducts reverted. Census instrumentation used for counts was
  fully reverted before the diet was written (verified via `git status`).

## Mechanism (one)

Diet of the analysis-expectation construction paths (`analysis::analyze` 22wt,
`css::expectations` 16wt — the unworked diag remainder). Five sub-edits, one
mechanism (fewer walks, fewer strings, same bytes):

- **D1 — per-surface content gates** (`analysis/mod.rs`): the `css()` walk runs
  only when the content contains `css`; the JSX walk only when it contains `<`.
  Soundness: every live `css` site needs `css` bytes (imported name, reserved
  alias, or `.css`/`.object` member — aliases still carry the bytes in their
  import); every JSX element needs a `<` byte. Shadows and the import scan emit
  no facts, and streamed files are needle-free by `streaming_candidate`
  construction, so the gates preserve behavior on retained, streamed, and
  dummy-program inputs alike. On the seed-7 load the `<` gate skips **all 3,122**
  JSX walks (zero walked files contain `<` — verified by census and by reading
  every bench template); the `css` gate skips 2 (tokens/global).
- **D2 — borrow static keys** (`conditions.rs`, `object.rs`, `structured.rs`,
  `jsx_attrs.rs`): `KeyClass::Static` goes from `String` to `Cow<'_, str>`.
  Identifier/string keys borrow the AST; only canonical numerics allocate.
  Entry/bag sites (40,621 on the load) drop the intermediate `String`; the
  responsive-object path keeps its owned key (serde `Map` needs it) via
  `into_owned()`. No fact byte changes: every downstream copy is unchanged.
- **D3 — borrow import spellings** (`imports.rs`): `imported_name` returns `&str`
  instead of allocating a `String` per specifier (~8k allocs on the load).
- **D4 — scan imports once** (`mod.rs`, `css.rs`, `jsx.rs`): `analyze` scans a
  source's imports once and shares the `FileBindings` with both surfaces
  (visitors take `&'b FileBindings`). Zero gain on this load (no file runs both
  walks) — general hygiene for JSX-bearing repos.
- **D5 — flatten member tags once** (`jsx.rs` `allows_tag`): one `replace('.',"")`
  instead of up to two. Pure CSE, zero load gain, identical by construction.

Deliberately NOT touched: shadow/binding/set hasher types (hashers' banked
FxHashSet mechanism — see §Collision), `facts.rs`/`SourceSite`/`OwnedLookupKey`
types (sharing would cross into proof/, swarm-proof's live ground), `facts`
reserve heuristics (peak-RSS risk for ~1 ms — considered, rejected).

## Diff

```
.../atomic/src/diagnostics/analysis/conditions.rs  | 49 ++++----
.../atomic/src/diagnostics/analysis/css.rs          | 16 +--
.../atomic/src/diagnostics/analysis/imports.rs      | 13 +-
.../atomic/src/diagnostics/analysis/jsx.rs          | 24 ++--
.../atomic/src/diagnostics/analysis/jsx_attrs.rs    |  5 +-
.../atomic/src/diagnostics/analysis/mod.rs          | 43 +++++-
.../atomic/src/diagnostics/analysis/object.rs       |  3 +-
.../atomic/src/diagnostics/analysis/structured.rs   |  2 +-
.../reference-rs/modules/atomic/src/tests/gates.rs  | 98 +++++++++++++++
9 files changed, ~150 insertions(+), ~50 deletions(-)
```

Plus 5 new gate pin tests in `gates.rs` (gate unit edges incl. spaced/newline
calls, comparisons, generics, reserved aliases; `<`-free css e2e with numeric
key; recipe-only silence; css-free JSX e2e).

## Mechanism counts

Enterprise seed-7 census (env-gated atomics, instrumented build, since reverted;
syncMs discarded; every number cross-checks):

| counter | value | reads as |
| --- | --- | --- |
| analyze_calls / sources_total / skipped | 1 / 15,122 / 12,000 | 1 compile; dead files gated |
| walked (css_walks = jsx_walks) | 3,122 | 3,000 style + 120 recipe + tokens + global |
| walked_with_css / walked_with_lt | 3,120 / **0** | D1 skips 3,122 jsx walks + 2 css walks |
| static_key calls / Static / numeric | 56,287 / 56,287 / 0 | zero computed keys on load |
| ↳ entry / keytext / bag sites | 40,621 / 15,666 / 0 | D2 kills 40,621 entry Strings |
| expect (exact) / dynamic | **35,426** / 0 | matches diag's 35,426 exactly |
| shadow param / declarator inserts | 6,000 / 17,746 | D1 kills the jsx half: 11,873 Strings |
| scan_imports calls / css-jsx-ns | 6,244 / 6,000-0-0 | D1 kills 3,122 scans + ~3k Strings |
| style_position_probes / nested_when_pushes | 10,428 / 5,195 | — |
| format_element / format_attribute names | 0 / 0 | no JSX on load (D5 general-only) |

Removed per enterprise sync: 3,122 dead jsx walks (full program visits) +
~52k String allocs (40,621 keys + 11,873 shadows + ~3k imports + ~8k specifiers
at D3) + 3,122 import scans. No expectation added, lost, or altered (see §Expectation
preservation).

Flame cross-check (repro1/2, compile scope): `analyze` 22/21 =
`css::expectations` 16/14 + `jsx::expectations` 3/4 + vec/memmove/memchr residue;
`static_key` 3/5 (write_str + malloc callees); `expect` 5 (malloc + Box-clone).
D1 removes the 3–4wt jsx leg; D2 removes the entry share of `static_key`.

Fantasy model at census time: D1 ≈ 4.5–6 ms, D2 ≈ 3–4 ms, D3 ≈ 0.5 ms →
8–11 ms. **Correction after measurement (§A/B): the model overstated.**
3–5wt flame frames are 3–5 samples with documented ±2–3wt jitter, and nano
per-alloc costs came in well under the assumed 60–80 ns. Directional
evidence is consistent with a true effect of ~2–3 ms (below the set's
resolving power — honest BANK, not LAND).

## Correctness

- (a) `pnpm agentrs c atomic`: **PASS** — 575 lib + 1 integration, 0 failed
  (baseline 568 + diag's 2 + my 5 new gate tests). `pnpm agentrs q` on the
  analysis dir + gates: **ALL 14 FILES PASSED, 0 violations, 0 warnings**
  (an intermediate cognitive-17 warning on `analyze` was cleared via the
  `source_facts` split before the final build).
- (b) Byte-identical outputs base vs cand on all four scales (css/data bytes
  also exact). Enterprise hashes reproduce diag's filed hashes exactly
  (`7ec827fb…`/`718d19e4…` — same seed-7 outputs, cross-crew corroboration):

| scale | styles.css (sha256, both arms) | runtime-data.mjs (sha256, both arms) |
| --- | --- | --- |
| enterprise | `7ec827fb…10dcea` (2,867,925 B) | `718d19e4…8918` (214,466 B) |
| small | `ecdec1e8…a2973` (92,651 B) | `ad9194f4…d41` (91,030 B) |
| medium | `37f2ef5b…19fe` (348,780 B) | `54735e4d…fe7ce` (110,241 B) |
| churn | `1aad4978…ec05` (8,289,806 B) | `e1349305…cdb` (103,709 B) |

- (c) Determinism: two further candidate enterprise runs byte-identical to each
  other and to the identity pair (`7ec827fb0c0cf685` / `718d19e470176b97` ×2).

## Expectation preservation (beyond the quiet bench load)

The bench load is expectations-quiet on the JSX surface (0 jsx facts) and
dynamics (0 slots), so soundness was proven over a 42-fixture adversarial
corpus through `compile()` with `logs: ['compiler','proof']` on **both** arms,
hashing stylesheet + diagnostics + compilerDiagnostics + wants + atomCount
(stable key order). Result: **DIFF-CLEAN on all 42 fixtures.**

Expectations-bearing coverage (base arm; cand identical): 27 fixtures carry
~40 `ATM-I-EXPECTED-LOOKUP` renders (static, nested, responsive, important,
alias, numeric-key, spaced/newline calls, reserved alias, namespace, member,
spread/merge, const-spread, holes, custom props, string/unicode keys, generics
co-presence, unary folds, JSX attrs/blocks/spreads/fragments, mixed css+JSX)
and 14 fixtures carry ~23 `ATM-I-DYNAMIC-SLOT` renders (unknown values/props/
whens/spreads, conditionals, const blocks, r-objects, param shadows). Silence
pins (0/0, must stay empty): shadowed css/tags, unimported calls, scalar args,
recipe-only, tokens-shaped, dead, untraced member tags, native-style/unknown
tags, TS assertions. The only uncovered firing path is a member tag against a
*traced/concatenated* host (no CompileRequest knob exists to configure hosts);
D5's change there is a pure CSE of one `replace` — identical by construction —
and the silent-member case agrees across arms.

## Enterprise A/B: 8 interleaved pairs, `.node` swapped per arm

`pnpm bench:neo -- --scale enterprise --runs 1 --json` (pairs without `--keep`).
Sample = `scales[0].samples[0].syncMs`. 2 unscored warmups per arm, then 8
pairs alternating order (B/C, C/B, …) under one bench-lock hold.

Warmups (unscored): base 1059.99, 1060.09; cand 1073.01, 1057.01.

| pair | base syncMs | cand syncMs | Δ ms | Δ % |
| --- | --- | --- | --- | --- |
| 1 | 1065.06 | 1067.25 | +2.19 | +0.21% |
| 2 | 1070.83 | 1057.15 | −13.68 | −1.28% |
| 3 | 1064.26 | 1078.48 | +14.22 | +1.34% |
| 4 | 1064.19 | 1061.51 | −2.68 | −0.25% |
| 5 | 1073.13 | 1056.63 | −16.50 | −1.54% |
| 6 | 1052.55 | 1068.75 | +16.21 | +1.54% |
| 7 | 1060.60 | 1053.03 | −7.57 | −0.71% |
| 8 | 1069.95 | 1066.52 | −3.43 | −0.32% |

- base median: **1064.66 ms**; cand median: **1064.01 ms**
- median Δ: **−0.64 ms (−0.06%)**, 5 of 8 pairs favor candidate.
- Excluding pair 1: median Δ −2.75 ms (−0.26%) — direction stands.
- Median per-pair delta: −3.06 ms.

Noise disclosure: per-pair swings reach ±16 ms (heavy overnight contention —
sibling builds ran through the hold, the documented norm). With SE ≈ 5 ms on
the median, this set cannot resolve a ~2–3 ms true effect; the point estimate
is sub-bar and the verdict is BANK on mechanism + identity, exactly the
cascade precedent (banked on +3.4/ex1 −0.6 vs ±20 with counted mechanism).
The sum-confirm + per-component bisect exists to resolve it. No second
hypothesis, no bundle on faith — the A/B above is the number.

## Collision

- **hashers (banked, set-2 integration in flight — ADJACENT, sequence-after):**
  converts every analysis `HashSet<String>` → `FxHashSet<String>`. My diet
  deliberately names no hasher type: likely textual adjacency in `css.rs`/`jsx.rs`
  visitor structs (both rewrite the struct block; orthogonal lines — FxHashSet
  fields × my `&'b FileBindings` + lifetimes compose mechanically) and in
  `mod.rs` (my `source_facts`/gate insertion sits between `analyze()` and
  `is_shadowed`, both touched by hashers hunks — integrator applies both).
  `conditions.rs`/`object.rs`/`imports.rs`/`structured.rs`/`jsx_attrs.rs` hunks
  are disjoint lines. No mechanism overlap (hashers = hash fn; mine =
  walk/string diet).
- **swarm-proof (live proof/render, re-seed #1):** untouched — no file under
  `diagnostics/proof/` modified; `facts.rs`/`SourceSite`/`OwnedLookupKey` types
  unchanged. RACE RULE respected by fence.
- **diag (LANDED partition skip, `channels/mod.rs`):** cited, not touched —
  my remainder starts where its dead-render skip ends.
- **keys2 (LANDED serializer diet):** expectation bytes flow through
  `serialize_lookup_key`, but the diet changes no key bytes — adjacent, landed.
- **New base note:** crews were observed pinning `0a573168` (post-set-2); this
  REPORT pins the briefed `810b8b5b4` set-1 landing. The diet composes with
  hashers as analyzed above; the captain reconciles.

## Verdict

**BANK — sub-bar proven-identical diet (median −0.64 ms, ex-run-1 −2.75 ms,
per-pair median −3.06 ms vs ±16 noise; counted mechanism ≈ 52k allocs +
3,122 dead walks removed; 4-scale byte-identical; determinism ×2; 42-fixture
differential DIFF-CLEAN with ~40 looks + ~23 slots preserved; suites 576 green;
quality 14/14 clean). Joins the combined set for sum-confirm.**
