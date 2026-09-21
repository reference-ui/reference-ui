# Fasthull review — Wave 3, lane e (data reshape, C5)

**Verdict: GAPS** — one lane-coupled failure: the committed harvest-census
react.mjs pin does not match the committed code (details below). Everything
else verified firsthand.

Reviewer ran in `/Users/ryn/Developer/reference-ui-perf-3-e`
(branch `voyage/hyperspace-perf-3-e`) without touching product/spec/fixture
files. Box shared with 5 siblings; wall/RSS treated as noise, bytes/tests as
signal.

## Gap (1)

**G1 — stale react.mjs census pin, lane-coupled.**
`packages/reference-rs/modules/atomic/tests/harvest-census.test.ts:103-104`
pins `reactRaw: 149412, reactGzip: 32876`, but `pnpm agentrs v atomic`
measures `reactRaw: 149479 (+67), reactGzip: 32889 (+13)` — deterministic 3/3
runs. Suite result is **299/301**, not the claimed 300/301: the second failure
besides ATM-SITE-54 is this pin (`tests/harvest-census.test.ts:337`, "publishes
react.mjs bytes"). Forensics: `recipe.ts` mtime postdates the census repin in
the same `stat` call, and it is the only bundle-input file edited after the
pin (`system.ts`/plan/table predate it; `recipe.test.ts` does not ship) — the
final derivation-code tweak landed after the pin was measured and the suite
was never re-run. The drift is code-only: every css pin in the same file
passes (`cssRaw 341037, cssGzip 41496, cssBrotli 21057, fixtureRules 4941`,
`m500Rules 33806`), and the fixture ships 0 recipes, so no data bytes are
implicated. Fix for lane (reviewer is forbidden from spec edits): repin to
`reactRaw: 149479, reactGzip: 32889` and re-run the suite.

## Verified firsthand

**Boundary (diff vs HEAD: 29 files).** All touches are inside the allowed set:
`table.rs`, `plan.rs`, `recipe.ts` + test, `contracts/{types.ts, tests,
fixtures}`, `modules/atomic/js/types.ts`, `system.ts` mirror, ATM
RECIPE-02/04/05/06/07/08/09 + SITE-03/10/15/55, `spec-recipes.test.ts`,
`harvest-census.test.ts` (react pin only, diff-confirmed), NEO-RECIPE-02/04/11
specs, plus the VOYAGE log and `reports/latest` (bench-run scratch, allowed).
`git diff --name-only | grep -Ei 'assembly|ladder|scan|extract|emitter|hosts|
generator|scale|sampler'` returns nothing. No css-output or css-adjacent pin
edits.

**E2E recompute (implementer's script, rerun).** `node /tmp/lane3e-e2e.mjs`
with pre/post pairs against the lane's `recipe.ts`: enterprise
`L1 440/440/1540/880 exact, 216 dupes collapsed; L2 5728/5728 (316 collapse)`,
medium `88/88/308/176, 46 collapsed; L2 1140/1140 (71)`, churn `120 tables,
240 indices, 0 compounds; L2 840/840` — all `E2E: ALL EXACT`, counts match the
lane's claims. Post shape asserted by the script: no `qualifiedName` /
`variantKeys` / `combinations` / `selection` / `className` anywhere.

**Independent hand-derivation (3 records, incl. one `["true"]`).** Against the
Rust rule at `modules/atomic/src/recipes/name.rs:38-52` (lone `["true"]` →
axis key; else `values.join("_")`; empty → `{stem}_c`):
(1) pre-ent `bench-enterprise__accordion106 {tone:accent,size:lg}` →
`…_c_accent_lg` ✓; (2) pre-ent `…__accordion106Body {mood:danger,size:sm}` →
`…_c_danger_sm` ✓ (both records visibly shipped as exact-dupe pairs,
confirming the collapse characterization); (3) `native-runtime-artifact.json`
fixture `{variant:[solid],disabled:[true]}` → `lib-test-system__button_
c_solid_disabled` ✓ — byte-equal to the removed compiler className, exercising
the axis-key rule. The TS port (`recipe.ts` `compoundClass`) is line-for-line
faithful to the Rust rule, and `table.rs` dedupe keys on order-sensitive
`format!("{predicates:?}")` (reordered predicates never collapse).

**Bytes.** `cmp` on kept repos: styles.css byte-identical pre/post at
med/ent/churn; all six `/tmp/lane3e-{pre,post}-*` snapshots `cmp`-equal their
kept-repo counterparts. Data: med `130016→110241 (-19775)`, ent
`318688→214466 (-104222)`, churn `112959→103709 (-9250)`. Fresh `--keep` runs
in the lane tree: small `css 92651 / data 91030 (-4911), 171 calls`; medium
`css 348780 / data 110241, 635 calls`, byte-identical to kept post + snapshot.
css pins `92651 / 348780 / 2867925 / 8289806` all exact.

**Stability.**
- `pnpm agentrs c atomic`: 535 lib + 1 integration, 0 failed.
- `pnpm agentrs v atomic`: 299/301 (G1 above + SITE-54). SITE-54 failure is at
  `ATM-SITE-54/spec.ts:43` (`hasWant` false in a specifier-resolution station
  over padding/color wants); the file is untouched by the lane and contains
  zero recipe surface — no coupling to the reshape.
- contracts vitest: 13/13. Neo vitest: 234/234 (`recipe.test.ts` 22/22,
  including multi-value, `["true"]`, and legacy-fallback cases).
- `pnpm agentneo run`: 173/173 OK (last-run.json tally), incl. NEO-RECIPE-02/
  04/11 PASS with renegotiated literal asserts and paint holds.
- `pnpm agentrs q` on table/plan: 0 violations, 1 warn (table.rs 448 lines;
  baseline already 391, pre-existing warn band, under the 500 hard fail).
  `pnpm agentneo q` on recipe.ts/system.ts: 0 errors, 1 warn (recipe.ts 366
  lines, 1 over the warn line).

**Contract sanity.** Renegotiated specs assert literals, not vacuous shapes:
index defaults (`{size: 1, tone: 1}`), unexpanded predicate literals with
authored-order key asserts, `toBeUndefined()` on every dropped field, identity
re-pointed to `Object.keys(runtime.recipes)`. Paint/class-string asserts are
retained (now inline literals, e.g. `@reference-ui/lib__badge_c_solid`).
`Deserialize` on the reshaped table reads the canonical in-memory shape only;
no consumer deserializes wire JSON (sole `from_str` in src is the unrelated
lowerings test) — noted, not a gap.

## Bottom line

The reshape itself is sound and byte-proven: wire minimized, css identical at
all scales, runtime derivation exact modulo characterized duplicate-token
collapse. The lane is one repin away from green: update the two census
constants per G1 and re-run `pnpm agentrs v atomic` to confirm 300/301 with
only the pre-existing SITE-54 failure.

## Addendum — re-check 2026-09-21 (~05:10 BST), independent reviewer #2

**Verdict: VERIFIED.** G1 is closed; nothing else moved.

**Delta since prior review is pin-only.** `find -newer` against this memo's
own mtime (05:06:00) returns exactly one file:
`packages/reference-rs/modules/atomic/tests/harvest-census.test.ts`
(05:07:03) — newer than every bundle input (`recipe.ts` 04:40:26,
`table.rs`/`plan.rs`/`system.ts` earlier), so the mis-ordering that caused G1
is fixed. `git diff` on that file vs HEAD shows only the two constants
(`reactRaw: 148880→149479`, `reactGzip: 32718→32889`) plus the 2-line C5
comment; the changed-file set is still exactly the prior review's 29. No new
gap.

**Firsthand re-run.** `pnpm agentrs v atomic`: **300/301** — sole failure is
the pre-existing ATM-SITE-54 (`spec.ts:43`, `hasWant` false; file untouched by
the lane, zero recipe surface). Targeted census run: **4/4 pass**, including
"publishes react.mjs bytes". All other pins in the same file still pass, so no
bundle output moved under the repin.

Prior review's VERIFIED findings (boundary, E2E recompute, bytes, stability,
contracts) stand unmodified; only G1's repin was needed and it is now green.
