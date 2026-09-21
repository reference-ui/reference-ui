# Fasthull 4b implementer memo — "plan verdicts" (D2 tier A)

Implementer, Wave 4 lane B. Tier A LANDED (placeholders + carried keys +
fact-key memo); insert-skip DIED on a sweep-caught hole (LEAF-11, rule-level
proven); tier B was already KILLED by the architect. All work in
`voyage/hyperspace-perf-4-b`; no commits per crew rules.

## 1. What changed (4 files, all in-boundary)

`packages/reference-rs/modules/atomic/src/` only. `plan.rs`, `unit.rs`,
`resolve/*`, `token/*`, bridge/TS/emitter/load/generator/scale/sampler
untouched; `diagnostics/facts.rs` and `diagnostics/policy/analysis.rs`
untouched (architect §4 ceiling-not-floor held — no written why needed).

- `runtime/builder.rs` (+~120): `build()` keeps its signature and stays
  DEFAULT-FULL (one-line diff: `resolve_entry(decl, false)`); new
  `build_with_keys` (full plans + carried keys sidecar) and `build_diet`
  (diet plans + carried keys) sharing private `build_keyed` (keys ride
  alongside pushed plans only: `keys.len() == plans.len()`, deduped, in
  plan order). Diet skips per-atom `derive_slot` + `class_name_with_system`
  and returns one zero-alloc placeholder per nonempty plan
  (`diet_declarations`); resolve + the emptiness gate + diagnostics run
  identically. `object_slot` helper extracted (cognitive flatten, pure).
- `assembly.rs` (+~30): new `build_plans` helper — proof builds full plans
  with no keys (legacy path untouched); `!proof` builds diet plans whose
  carried keys collect (moved, never re-serialized) into the render join
  set. Render dispatches on the carried set (`match carried_keys`).
- `diagnostics/proof/render.rs` (+~35): new `render_session_with_keys`
  (takes the carried `BTreeSet<String>` by value); private
  `Proof::collect` now takes the emitted set directly (sole caller was
  `render_session`, which computes `emitted_keys(plans)` as before);
  shared `render_with` runs the join. Fact-key memo: `exacts` is now
  `Vec<(&OwnedLookupKey, String)>` — serialized once in `collect_exact`,
  reused in `render_causeless`/`is_explained`. `render_expected` untouched
  (excluded by the architect).
- `diagnostics/proof/plans.rs` (tests only, +~115): `dedupe_key_equals_
  emitted_key` (decl lookup-key vs `OwnedLookupKey` vs `emitted_keys`,
  with object-value sorting + when/important riding + literal pin);
  `build_with_keys_carries_the_emitted_set` (sidecar == emitted set,
  dedupe + plan order + empty-resolve exclusion); `build_diet_matches_
  keys_placeholders_and_inserts` (same keys, one empty placeholder per
  plan, diet atom-set == full atom-set).

## 2. Insert-skip: DIED (LEAF-11 hole, tripwire-caught)

First diet build skipped the `atom_set.insert` calls. The 244-sweep then
showed diagnostics identical 244/244 BUT `ATM-LEAF-11` cssLen 28779 →
28731 (−48 B). Rule-level diff (direct-native probe, `/tmp/w4b-leaf11-
{diet,restored}.css`): the insert-skip sheet LOST `.lib__w_50px
{ width: 50px; }` — the whole base-leaf rule, no twin in either dump.

Case input: `width: { base: '50px!', md: '60px' }`. Mechanism: pass-1
produces NO atom for the leaf-`!` shape, while the plan pass resolves it
(as non-important, matching the case's own warning: the `!` "serves the
non-important class"). The plan pass is the SOLE producer of a
user-visible rule, so plan atoms ⊄ want atoms and the subset proof's
"important mirrors at every paired site" leg is false for leaf-`!`
(a producer mismatch, not a mirror mismatch). Per the brief's ANY-delta
rule the sub-move was killed: inserts restored in the diet path
(`insert_diet_atoms` helper), placeholders + carried keys + memo kept.
Post-restore sweep is `cmp`-IDENTICAL 244/244 (diagnostics + cssLen +
plans). Insert-skip's ~15 ms stays on the table; nothing else changed.

## 3. Bench (locked load; box shared with 4 siblings, loads recorded)

Lead baselines: `/tmp/w4b-baseline` (load ~7-10), `/tmp/w4b-baseline-
churn` (loaded, 4.56 s single). Same-session HEAD control in pristine
`/tmp/w4b-head-ctl` @ c84dd4d7a (install + `agentrs b` + `build:js`;
left in place for re-proof with `/tmp/w4b-head-bytes/`,
`/tmp/w4b-post-churn*`).

| scale | HEAD medians | POST medians | Δ (matched pair) |
| --- | --- | --- | --- |
| small | 98 / 94 (ctrl) | 89 / 92 | ~−3, noisy |
| medium | 188 (H1, ld 5.7) | 177 (P1, ld 4.6); ~181 (P2, ld 5.0) | −4…−7 |
| enterprise | 1.34 (H1, ld 5.7); 1.32 (H2, ld 4.35) | 1.31 (P2, ld 5.0); 1.26 (P3, ld 4.38); 1.25 (P1, ld 4.6) | −30 touching; −60 SEPARATED |
| churn | 2.99 (ld 4.71) | 2.89 (ld 4.58) | −100 median, arms touch at 2.95 |

Enterprise pair 2 (loads 4.38/4.35, best matched): POST 1.26/1.26/1.31
vs HEAD 1.36/1.32/1.32 — no overlap, −60 ms median. Pair 1: −30 ms,
touching at 1.31. Shape is linear-in-wants (−3/−7/−30…−60/−100 across
171/635/7527/43956 calls), matching the lever (skipped slot/class
strings + key serialization + exact memo). The lead's 4.56 s churn
single is a contention artifact: HEAD re-measures 2.95–3.01 on today's
box; the honest churn read is the adjacent −100 ms median, suggestive
not separated. A medium P2 run-1 253 ms outlier is a contention blip
(sibling activity), median-robust.

Bundle: POST==HEAD==BASE byte-exact raw+gzip at ALL four scales
(small 92651/12566 + 91030/18736; medium 348780/40672 + 110241/19674;
ent 2867925/270510 + 214466/22110; churn 8289806/745661 + 103709/19339).
RSS: every sample interleaves inside the lottery band (ent 331–369 vs
336–370; churn 571–660 vs 590–612); no claim, no regression.

## 4. Stability

- `agentrs b`: green after every RS round. No TS touched (`git status`:
  exactly the 4 `.rs` files + lead-owned log/reports/memo/sweep);
  `build:js` not needed in-lane (run once in the HEAD control worktree
  only, where bench needs the JS dist).
- `agentrs q` on all 4 touched files: **0 violations**. Warns: builder.rs
  + render.rs file-length soft band (feature-inherent, boundary files
  cannot split; table.rs-391 precedent), `finish` 100 lines
  (pre-existing warn at 89, grown by the dispatch match). The
  `resolve_object` cognitive warn my first cut introduced was flattened
  away (`continue` style + `object_slot` + `insert_diet_atoms`).
- `agentrs c atomic`: 551/551 (548 baseline + 3 new pins), 0 failed.
- `agentrs v atomic`: 301/302 — sole red SITE-54, the known env failure
  (asserts `hasWant(result, …)` on pass-1 `wants`, a path this diff never
  touches; red on every prior lane).
- 244-sweep: `cmp /tmp/w4b-sweep-pre.json /tmp/w4b-sweep-post.json`
  IDENTICAL (post label run after the insert restore).
- `agentneo run`: 173/173 ok.

## 5. Landed / died

- LANDED: tier A — placeholder declarations (diet `!proof`, full on
  proof), carried canonical keys (`build_with_keys`/`build_diet` +
  `render_session_with_keys`), render.rs-internal fact-key memo.
- DIED: insert-skip — killed by the 244-sweep (ATM-LEAF-11 −48 B, sole-
  producer rule proven at rule level); inserts restored, all else kept.
- Memo path: fact keys serialize once per session (`collect_exact` →
  `render_causeless`/`is_explained`); `render_expected` memo excluded
  per architect (callers out of boundary).

Reviewer pointers: the win lives or dies on adjacent enterprise pairs
(H2/P3 separated −60 ms is the cleanest); re-proof needs only
`agentrs b` + `bench:neo --scale enterprise --runs 3` here vs
`/tmp/w4b-head-ctl` (do NOT reuse its `reports/latest` — clean trees
pin hash-named report dirs; see §3 note).
