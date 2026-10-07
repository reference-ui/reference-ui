# GATES.md — voyage-robustness frozen bars

Frozen from `reports/PLAN.oracle.md` and `reports/DESIGN.oracle.md` **before**
product edits. A wave's proof is admissible only if every step is executed and
evidenced; a skipped step voids the wave.

## Ordered proof protocol (every land)

1. **Dist provenance.** The documented path is now dist mode; attest that
   `packages/reference-neo/dist` is fresh from the pinned tip (rebuild via
   `ensure-dist`/`build-bin`, record clean-tree status + wall time + input hash).
2. **Reproduce the bar** below on the exact tree, fresh process.
3. **Identity — sync first, then verify.** Run the documented syncs, attach
   outputs, then `verify-pins.mjs`. A verify with no preceding fresh sync is
   vacuous.
4. **Suites** named per wave; paste commands + results.
5. Captain re-runs the decisive gates, commits named files only, one verified
   arc per commit.

## Frozen bars

| wave | bar |
| --- | --- |
| **C1** | Documented lib `sync` leaves all four lib artifacts (`system/baseSystem.mjs`, `react/react.mjs`, `react/react.mjs.map`, `types/types.mjs`) at their pinned dist hashes; `verify-pins` **PASS**; **`git diff pins/baseline.sha256` empty** (zero emitted-byte churn); fresh clone `install → lib build` green via automatic neo build (`ensure-dist`); steady-state gate ~nil (mtime); neo suites + `agentneo q` green; residual paragraph added to `docs/bugs/NEO_EMIT_MODE_DRIFT.md`. |
| **B3-depth** | Every `react.mjs.map` source absolutized against the live dir resolves to a real file; pin delta = **depth lines only** (`../` level), diff-reviewed; single captain-owned re-baseline of the `.map` pins only. Cross-mode map identity is CUT (residual). |
| **B4** | Token touch without sync → `check:dist` **FAIL** naming baseSystem; dataless-but-named fixture → smoke **FAIL** (requireFragment shape). |
| **B5** | Fixture tmp-project (config + relative helper → barrel) **FAILS** the guard; all in-repo configs pass. |
| **B6** | Win32-shaped `ERR_MODULE_NOT_FOUND` message gets the hint; existing tests green. |
| **Residual** | Drift doc + mission ledger record the content-class residual: source mode = neo inner-loop only, never a documented build path; shipped bytes dist-only; any future cross-mode byte gate scopes to dist mode. Closeout confirms. |

## CUT (do not revive without fresh flames)

B2 output-normalization/blanking; B3 cross-mode map identity; T2 config-load
staleness guard; T3 mission-script hardening; compile-request relativize
(breaks SITE-28 replay); alias canonicalization (no fresh-checkout-safe form);
narrow-bootstrap-entry. Content surgery (unminify/re-minify, format
canonicalization) — rejected.

## Contract fence

No `packages/reference-rs/contracts` or engine-request shape changes anywhere.
All robustness work is scripts, gates, one map-relativity fix, and docs.
