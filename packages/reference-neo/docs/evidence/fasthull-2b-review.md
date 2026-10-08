# Fasthull 2b review — "dead product" (B3+B5): VERIFIED

Reviewer, disjoint from profiler and implementer. All items below verified
firsthand in-tree (branch `voyage/hyperspace-perf-2-b`); pre-change behavior
reproduced from a detached-HEAD scratch worktree in /tmp (built + benched,
then removed). No product edits made. No bare stash used anywhere.

## 1. Diff vs boundary: CLEAN

49 modified + 3 untracked memos; zero foreign files (no lane-C logic, no
burndown.ts, no scale/generator/sampler edits — GOODHART clean; cssCalls
171/635/7527/43956 in my own runs).

- `assembly.rs`: 7 hunks, all original-lines ≤:120 (struct flag :28,
  destructure, kill-comment, css gate `:88`, collect gate, `css`/`wants`
  moves). Nothing ≥:146. Plan build + `render_session` unconditional —
  B3 plan-gating is DEAD in the diff, per the tripwire ruling.
- `lib.rs`: ONE added line (`proof: request.wants_proof()` at :106). ✓
- `types.rs`: `wants_proof()` helper only. ✓ `native.rs`: untouched. ✓
- `recipes/mod.rs`: `:98` one-liner (`build` → `build_shipped`) + `:348`
  test collateral only; `compile_variants` :103-120 and gate :128-144
  untouched. ✓ `builder.rs` untouched (inversion skipped, allowed).
- `table.rs` / `runtime/plan.rs`: B5-owned, as contracted. ✓
- `system.ts`: hunks at :95-97 (table mirror) + :136 (artifact field),
  string-literal TYPE MIRROR ONLY, zero logic. ✓ `react.ts`: header
  one-liner. ✓ `recipe.ts` + `recipe.test.ts` + `contracts/types.ts` +
  `js/types.ts` + contracts tests/fixtures: B5 sections only. ✓
- `extract/*`, `hosts/tests.rs`, `includes/mod.rs`, `gates.rs`,
  `seed.rs`, `spec_recipe_tests.rs`: proof-logs/test collateral only;
  zero diagnostics-assertion touches (diff-wide grep: only log lines +
  one code comment mention `diagnostics`). `seed.rs` pins
  `css.is_none()` as the architect ordered.
- Docs: SPEC.md :712/:727, recipes/README :14-15, RECIPE-07 README :3 —
  exactly the contracted lines.

## 2. Tripwire: KILL STORY CONSISTENT

`render_session` joins `emitted_keys(plans)` against expectations
(`render.rs:24-35`, `plans.rs:26-31`); empty plans ⇒ covered rejects keep
legacy lines + causeless `MissingStylePlan` warnings grow. The
"has no compiled style plan" prefix exists at `policy/proof.rs:36,45`.
Gating plans (or skipping render) MUST move default diagnostics — the
12/243 sweep-delta kill is exactly what the code predicts. Reduced B3
(css/recipes/wants) is coherent: under `proof` every gate re-evaluates
the identical expression (`.then(|| build…)`, `if proof { wants }`),
so proof ⇒ all rows restored; cargo 511+1 (proof-logged row asserts),
vitest stations (harness always sends proof), and agentneo 173/173
prove it behaviorally.

## 3. Bytes: VERIFIED FIRSTHAND (own /tmp HEAD worktree + own probes)

My HEAD build reproduced the profiler baseline exactly (ent css
15,007,762 B, data 530,606 B). Pre/post cmp over all 4 scales:

- `styles.css`: byte-IDENTICAL all scales + churn (15,007,762 ent). ✓
- `diagnostics.json` (`[]`) + `traced.json`: identical all scales —
  the fence holds. ✓
- `runtime-data.mjs`: 530,606 → 318,688 ent (518.2 → 311.2 KiB,
  −40.0%); small 102.5 → 93.7, medium 164.3 → 127.0, churn 143.2 →
  110.3 KiB — every figure matches the note. ✓
- Hoist step −22.3 KiB: derived EXACTLY from my captures (440 uniform
  per-table lists, 1 unique value; 440×52−52 = 22,828 B). ✓
- `baseSystem.mjs` deltas (all scales): after tmpdir-path
  normalization, every differing line is recipe-reshape or probe-tmpdir
  (churn's `compoundVariants [],` vs `[]` is the dropped-field comma).
  No other content moved. ✓
- React pins: my census-bundle probe reproduced 148,601 (HEAD) and
  148,880 (post) raw + 32,633/32,718 gzip EXACTLY. Minified-content
  check shows only per-hypothesis parts: 3rd `registerRecipeData`
  param + call-site, derivation port (`stem`/`axis`/hoist read),
  hoisted `responsiveBreakpoints:[]`. The +50 hoist leg (148,830 →
  148,880) matches the minified header+field bytes arithmetically;
  the 148,830 intermediate itself is implementer-reported (no
  intermediate tree state exists to re-derive it).

## 4. E2E recompute: EXHAUSTIVE, ALL EXACT (own script)

From NEW shipped inputs (stem + value-name lists), checked against OLD
shipped strings AND the post sheet: medium base 88/88 + variant 792/792
(== old, in sheet) + responsive 3960/3960; enterprise base 440/440 +
variant 3960/3960 + responsive 19,800/19,800. Totals 528/528 + 4,752/4,752
match the note. Zero compound/default/variantKeys drift. (`2xl` needs the
CSS digit-escape in the checker — verifier artifact, not product.)
No natural first-char collisions in bench data; collision handling is
proven by the tone/tint LITERALS unit in `recipe.test.ts` (green in my
19/19 run) mirroring `name.rs` `axis[0]`.

## 5. Paint + stations: NO WEAKENING

Zero paint-assertion changes anywhere (NEO + engine diffs grepped;
e.g. NEO-08's paper-background assert is untouched context).
NEO-RECIPE-01/05/06/07 untouched. All 7 NEO specs + 12 engine stations
(architect list + RECIPE-05/06/08, SITE-10/55) are literal
renegotiations: exact `toEqual` value-lists and STEM literals replace
self-referential table-derived expectations (strictly stronger —
`recipe()` output is now asserted against literals). `mod.rs:348` keeps
the rules asserts; `res.recipes` proof collateral present.

## 6. Stability: FIRSTHAND GREEN

- cargo atomic: 511 + 1, 0 failed. ✓
- vitest atomic: 299/300, ONLY SITE-54 red. Pre-existing, proven
  WITHOUT stash: spec+input identical to HEAD; input has zero
  `recipe(` bytes (B5 invisible); runner passes no extras ⇒ harness
  `logs:['proof']` ⇒ B3 gates are no-ops on this input; failing assert
  (`hasWant`, specifier-resolution want) lives in resolver/specifier
  code with zero non-test source diffs. Lane deltas are behaviorally
  void on this input ⇒ red is definitionally pre-existing.
- contracts 13/13 ✓, recipe units 19/19 ✓ (incl. collision + hoist
  units), agentneo 173/173 (0 failed, this session) ✓.
- `agentrs q` on 6 lane files: 0 violations, 3 soft warns (finish 88,
  table.rs 392, lib.rs 383 — disclosed; lib.rs warn pre-exists at 382).
  `agentneo q`: 0 errors; 0 warns on lane files.
- Churn ran: css identical (8,720,007 B), data −23%, diagnostics
  identical. ✓

## 7. Bench: SYNC −70ms CREDIBLE (thin), RSS NO CLAIM, DATA −40% THE WIN

Box shared with 3 siblings throughout (load 2.6–5.8; my early post-only
samples swung 2743–3092ms with load — absolute medians are meaningless
across sessions). Alternating HEAD/post A/B, same box, minutes apart:
HE1 2450/597.9 → PO1 2375/612.1 → HE2 2456/611.0 → PO2 2387/632.3.
Sync −75/−69ms with ±6ms within-arm spread: clears the session spread
by design (drift-cancelled), agrees with the note's −90ms
direction/magnitude. RSS went UP both pairs (+14/+21): no-claim
AGREED, and then some. Data −40.0% verified byte-firsthand — the win.

## Gaps: NONE. Observations (non-blocking)

1. RECIPE-04/SITE-03 keep vestigial self-referential asserts (literal
   string built, then assert-contains-same-literal). Dead weight, not
   weakening — shape pins strengthened, composition proven in
   recipe.test.ts + NEO specs. Optional cleanup.
2. `reports/latest/` is TRACKED (committed pre-voyage); every bench run
   dirties it. I restored it post-run. Captain may want it ignored.
3. Intermediate pins (148,830; 341,516) are process detail, verified
   arithmetically but not re-derived — endpoints verified exactly.

## Verdict: VERIFIED

Reduced B3 is byte-clean with the tripwire kill honored; B5 moves data
−40% per hypothesis with css/diagnostics/paint identical, derivation
proven exhaustive, stations renegotiated to stronger literals, and
stability green modulo pre-existing SITE-54. Merge flags from the
implementer note (`system.ts` hunks, EXPECTED_BYTES, `mod.rs:98`) stand.
