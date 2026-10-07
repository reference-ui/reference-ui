# GATES.md — voyage-robustness frozen bars

Frozen from `reports/PLAN.oracle.md` and `reports/DESIGN.oracle.md` **before**
product edits. A wave's proof is admissible only if every step is executed and
evidenced; a skipped step voids the wave.

## Ordered proof protocol (every land)

1. **Dist provenance.** The documented path is now dist mode; attest that
   `packages/reference-neo/dist` is fresh from the pinned tip (rebuild via
   `ensure-dist`/`build-bin`, record clean-tree status + wall time + input hash).
2. **Reproduce the bar** below on the exact tree, fresh process.
3. **Identity — sync first, then verify, from the package dir.** Run each
   package's **documented** sync (package cwd — the literal documented
   invocation, per `CWD.oracle`), attach outputs, then `verify-pins.mjs`. A
   verify with no preceding fresh sync is vacuous; a root-dir-arg sync is a
   valid invocation but **not** admissible as the identity proof (it hid the
   cwd axis for a voyage).
4. **Suites** named per wave; paste commands + results.
5. Captain re-runs the decisive gates, commits named files only, one verified
   arc per commit.

## Frozen bars

| wave | bar |
| --- | --- |
| **C1** | Land as-is (amended per `CWD.oracle`): root-cwd documented-form sync reproduces all four lib pins (zero churn — proves **mode unification**); package-cwd delta confined to **banner lines** in `baseSystem.mjs`/`types.mjs`, banner-stripped equal (proves cwd is the only remaining axis); `ensure-dist` fresh-clone + steady-state + opt-out proofs; `check:dist` FAIL (B-11) stays open as expected (resolves after C2 + one lib build — never by touching `dist` or the gate); suites + `agentneo q` green; drift-doc residual + caveat. |
| **C2** | **NEW — cwd canon**: `absWorkingDir` = neo package root (`import.meta.url`) set unconditionally in `buildMicroBundleOptions`; resolve `config/bundle.ts` metafile keys against the exported canon base (R3 edge); `build-options.test.ts` pins the value + a cross-cwd equality test; mcp dist rebuilt. Bar: same entry under two cwds ⇒ identical bytes; documented sync from *any* cwd leaves all pins; `react.mjs`×3 + maps×3 **byte-identical** pre/post (lever-side-effect falsifier); **6-line** pin delta (`baseSystem`+`types` × docs/lib/icons) = banner lines only, banner-stripped equal; evaluated-spec/manifest/CSS identical; `bundle.test.ts` + neo suites + `agentneo q` green. **Two commits: C2 code, then pins-only.** |
| **B3-depth** | Unchanged, **re-sequenced after C2** (different files/mechanism; folding would mix re-baselines). |
| **B4** | Token touch without sync → `check:dist` **FAIL** naming baseSystem; dataless-but-named fixture → smoke **FAIL** (requireFragment shape). |
| **B5** | Fixture tmp-project (config + relative helper → barrel) **FAILS** the guard; all in-repo configs pass. |
| **B6** | Win32-shaped `ERR_MODULE_NOT_FOUND` message gets the hint; existing tests green. |
| **Residual** | Drift doc + mission ledger record the content-class residual: source mode = neo inner-loop only, never a documented build path; shipped bytes dist-only; any future cross-mode byte gate scopes to dist mode. Closeout confirms. |

Order: **C1 → C2 → B3-depth → micros B4/B5/B6 → closeout.**

## CUT (do not revive without fresh flames)

B2 output-normalization/blanking; B3 cross-mode map identity; T2 config-load
staleness guard; T3 mission-script hardening; compile-request relativize
(breaks SITE-28 replay); alias canonicalization (no fresh-checkout-safe form);
narrow-bootstrap-entry. Content surgery (unminify/re-minify, format
canonicalization) — rejected.

Note (`CWD.oracle` §3): the cwd canon (C2) is **not** B2 revived — it operates
within the single shipped mode, removes an ambient input (no post-pass, no
regex, line structure untouched), and is required for `dev == ship == pin`.

## Contract fence

No `packages/reference-rs/contracts` or engine-request shape changes anywhere.
All robustness work is scripts, gates, one map-relativity fix, and docs.
