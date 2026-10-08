# Fasthull 4b reviewer memo — "plan verdicts" (D2 tier A): VERIFIED

Reviewer (disjoint, rotation 3). Tree `voyage/hyperspace-perf-4-b` @ c84dd4d7a
+ uncommitted lane diff. Read-only except this memo: no product edits, no
formatter, no stash, no commits. Every number below is my own command output.

**Verdict: VERIFIED** — tier-A landing + tier-B kill + insert-skip kill all
proven firsthand. 6/6 checks PASS.

## 1. Diff vs boundary: PASS

`git diff HEAD --name-only` (mine, post-verification): exactly the 4
in-boundary files — `runtime/builder.rs`, `assembly.rs`,
`diagnostics/proof/plans.rs`, `diagnostics/proof/render.rs` — plus lead-owned
`VOYAGE-HYPERSPACE-PERF.md`, bench `reports/latest/*` (my own runs rewrote
them), and untracked architect memo / impl memo / `w4b-sweep.test.ts`. No
`plan.rs` / `resolve/*` / `unit.rs` / bridge / TS / emitter / load / generator
touch. `facts.rs` and `policy/analysis.rs` untouched (ceiling-not-floor held).
Read every hunk:

- `build()` DEFAULT-FULL, one-line diff (`resolve_entry(decl, false)`).
- `build_keyed` sharing sound: `diet=false` path is statement-identical to
  `build` (dead `diet_any` init + skipped `if diet` only); assembly proof
  path still calls legacy `build()`, so the proof channel is byte-identical
  by code path, not just by test.
- `object_slot` extraction equivalent: `responsive.then_some(key)` routes to
  `derive_slot(prop, decl_when, Some(bp))` else `derive_slot(prop, step_when,
  None)` — same arms, same args as the inlined original.
- Carried-set == emitted set by construction: plans copy all five tuple
  fields from the decl, and both `AuthoredDeclaration::lookup_key` and
  `OwnedLookupKey::lookup_key` serialize through the one authority
  (`serialize_lookup_key`, `serializer.rs:62-72`); keys ride alongside pushed
  plans only (`keys.len() == plans.len()`, deduped, plan order). Pinned by 3
  unit tests (dedupe==emitted incl. object-key sorting + when/important
  riding + literal pin; sidecar==emitted incl. empty-resolve exclusion;
  diet keys/placeholders/inserts).
- `render_session` legacy path identical: `emitted_keys(plans)` computed at
  the same point, `render_with` is the old body verbatim.
- Fact memo same strings: one `lookup_key()` call per exact in
  `collect_exact`, reused in `render_causeless`/`is_explained`; `warned`
  insert semantics unchanged.
- No C4-pairing (no extract index, no rewant), no Goodhart (no generator,
  seed, scale, harness, or emitter touch — the win is skipped
  slot/class-string materialization + skipped re-serialization).

## 2. Tier-B kill: SOUND (concur KILL-B)

Re-derived firsthand, 5 cites spot-checked in-tree: `values.rs:36-135`
(scalars total; malformed-`$token` → None silent; numeric `$r` →
None + `NonCanonicalNumeric`; non-numeric `$r` → Some); `$r` grep shows no
extract producer (only lexical/values/serializer-test/builder) → (C2)
diagnostic is plan-pass-unique, confirmed; `resolve/mod.rs:127-235`
(unknown-prop early return before macro; `lower_conditions` Unknown →
empty; `Some(Vec::new())` sole at `:209`; `textGradient` macro-claimed
before the unrealizable check) + `textGradient` in
`modules/canon/src/css/unrealizable.rs:32` → ordering trap real;
`unit.rs:224-253` (Null silent, Bool refuses, Token always Some). The
silence-gated predicate is a ~200-line shadow-resolve over 6+ private fns
with uncensused coverage and permanent divergence risk. Specifiable ≠
proven. KILL-B stands. (A)-only is a complete landing, not GAPS.

## 3. Insert-skip kill (LEAF-11): REAL

Mechanism chain read firsthand, end to end: pass-1
`refuse_leaf_important` (`responsive.rs:150-152`) skips the
`base: '50px!'` leaf → NO want (pinned by
`responsive_leaf_important_refuses_with_diagnostic_and_skips_want`); plan
capture `convert_object` → `convert_literal` (`ast_value.rs:30`) splits the
`!` into the clean value `{base: "50px", md: "60px"}` + object-level
important=false; plan `resolve_object` resolves base→50px non-important →
plan pass is the SOLE producer of the `.lib__w_50px { width: 50px; }` atom.
Case input confirmed (`ATM-LEAF-11/input/src/css.ts:4`:
`width: { base: '50px!', md: '60px' }`). Implementer's
`/tmp/w4b-leaf11-{diet,restored}.css` diff is exactly that rule (−48 B).
My own probe on the current tree: cssLen **28779**, `cmp`-identical to the
restored dump, rule present. Inserts ARE present in the landed diet path
(`insert_diet_atoms` in all three resolve fns). Post-restore sweep clean
(§4). Subset claim dead at rule level; kill honest, tripwire worked.

## 4. Sweep: PASS — ZERO deltas

My own run: `W4B_SWEEP_LABEL=rpost pnpm agentrs v
modules/atomic/tests/w4b-sweep.test.ts` → 244 cases →
`cmp /tmp/w4b-sweep-pre.json /tmp/w4b-sweep-rpost.json` IDENTICAL, 0 errors.
LEAF-11 row: cssLen 28779, plans absent (slim drops plans on !proof —
diet-path consistent), 1 diag.

## 5. Bench: PASS — win clears spread on a matched pair

HEAD control `/tmp/w4b-head-ctl` verified @ c84dd4d7a (clean except its
bench report dir; dist fresh; reused, not rebuilt). Box shared with 4
siblings; loads recorded per run. All runs adjacent lane-vs-control.

| pair | load P/H | POST syncMs | HEAD syncMs | Δ med |
| --- | --- | --- | --- | --- |
| ent R1 (runs 3) | 5.29/5.48 | 1280/1280/1390* | 1300/1310/1350* | −30 touching |
| ent R2 (runs 3) | 5.17/5.29 | 1320.1/1337.5/1343.7 | 1296.9/1322.9/1351.0 | +14.6 interleaved |
| ent R3 (runs 3) | 4.40/4.45 | 1255.7/1274.8/1257.1 | 1291.4/1284.5/1291.9 | **−34.3 SEPARATED** |
| med (runs 1) | 4.58/4.78 | 182.6 | 188.7 | −6.1 shape |
| churn (runs 1) | 4.47/4.47 | 2795.3 | 2950.7 | −155.4 single-sample |

\* R1 from the rounded report table (result.json overwritten by R2; exact
lost — noted, not hidden).

R3 is the evidence: best-matched loads (4.40/4.45), POST max 1274.8 <
HEAD min 1284.5, no overlap, −34.3 median. R1 −30 touching corroborates;
R2 +15 is load-5.2 noise (within-side spread 40–55 ms at that load).
Pooled enterprise medians: POST 1280 vs HEAD 1300 (−20). Shape is
linear-in-wants (−6/−34/−155 across 635/7527/43956 calls), matching the
lever (skipped slot/class strings + key serialization + exact memo).
Below the 50–65 ms prediction, but direction + separation + shape all
match — the prediction was rough, the pair is real. Churn single is
suggestive, not evidence (stated as such).

Bundle EXACT raw+gzip, identical both sides, every scale I ran:
ent css 2867925/270510 + data 214466/22110; med 348780/40672 +
110241/19674; churn 8289806/745661 + 103709/19339. Zero growth.
RSS medians interleave (ent POST 342.4–392.6 vs HEAD 339.5–361.1; med
133.8 vs 127.3; churn 592.3 vs 578.3) — no claim, no regression;
mechanism (strictly less materialization) reads unregressed-by-design.

## 6. Stability: PASS

| gate | mine |
| --- | --- |
| `agentrs q` 4 files | 0 violations, 3 warns (builder 421 + render 382 soft-band; `finish` 100 lines — all pre-existing-shape, feature-inherent) |
| `agentrs c atomic` | 551/551 + 1/1, 0 failed |
| `agentrs v atomic` | 301/302, sole red ATM-SITE-54 |
| SITE-54 unrelated | red on pristine HEAD control too (my own run) + asserts `hasWant` on pass-1 `wants` (`spec.ts:43`), a path this diff never touches |
| `agentneo run` | 173/173 ok (`last-run.json`: 173 cases, 0 fails) |

## Rulings

- Boundary: CLEAN — 4 in-boundary files only, no breach.
- KILL-B: SOUND (concur).
- Insert-skip kill: REAL (sole-producer mechanism proven at rule level).
- Tier-A landing: VERIFIED — verdicts identical by construction + 244-sweep
  zero-delta + separated enterprise pair + byte-exact bundle + green
  stability (modulo pre-existing SITE-54).
