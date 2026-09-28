# CONTINUITY-R CHAIN REVIEW — verdict: VERIFIED (commit-ready)

Date: 2026-09-27. Oracle (independent of finder, reproducer, ruling, fortify crews). No commit — captain commits.

## 1. Blind repro now GREEN (firsthand)

`/tmp/doom-r-red.mjs` run unmodified: exit 0, `(none)` offending declarations, `2r` control intact. Oracle's pre-fix RED → post-fix GREEN on the same script.

## 2. Pins fail-without-fix / pass-with-fix (firsthand)

- Cargo (`resolve/rhythm/mod.rs`): both new tests pass with fix (15/15 rhythm-filtered). Fail-without-fix proven by temporarily reverting only the three call sites to bare `.parse().ok()?` (no git stash; file restored byte-identical after): `test_non_finite_stems_refuse_silently` FAILED, 7 others passed. Restored and re-confirmed green.
- Tick `ATM-RHYTHM-07`: spec GREEN firsthand (`cases.test -t ATM-RHYTHM-07`: 1 passed, 248 skipped). Tick fail-without-fix reasoned, not re-executed: the tick asserts the same sheet-text property over a superset of the oracle-replay literals on the same resolver, and the oracle replay is firsthand RED pre-fix / GREEN post-fix. (A NAPI rebuild cycle against reverted code was judged disproportionate risk on the shared tree.)
- Ruling pin coverage: all 9 literals (`infr nanr infinityr Infinityr -infr 1e309r 309-digit 1/infr inf/3r`) + controls (`2r`, `1/3r`) + finite guards (`0.5r`, `1e-3r`, `1e308r`) present; asserts read `result.stylesheet`, not the gauge. Cargo adds `-nanr`/`NANr` case variants (ruling asked for one; got two).

## 3. Full affected suites (firsthand)

- `pnpm agentrs c atomic`: **747 passed, 0 failed** (733+1+1+7+5 — exact match with fortify).
- `pnpm agentrs v atomic`: **304/305**; 12/13 files. Sole red is `harvest-census > publishes react.mjs bytes`: `expected 158317 to be 158073` — byte-identical to fortify's reported pre-fix baseline. Verified pre-existing/unrelated by structural independence: the pin measures the Neo `reference-neo/src/packager/react.ts` bundle (Neo runtime sources + `@reference-ui/rust/primitives`), which no file in this arc's diff (atomic rhythm resolver, test quarantine helper, new case fixtures) can feed. Never absorbed; quarantine untouched for it.
- Zero golden churn outside the new case: all 248 other case tests green unmodified.
- `pnpm agentrs q` on all three fortify paths: pass (no clippy allows, CC within limits).

## 4. Diff vs ruling boundary (line-by-line, firsthand)

- May-change: exactly the two parse sites via one shared `parse_finite_stem` → `lexical::parse_decimal(…).finite()` (ruling's recommended L3 entry). Single + fraction move together; `-inf`/`-nan`/case variants ride it (pinned).
- Close (a) refuse, silent: `?` → `None` → raw passthrough; no diagnostics added; spec asserts `diagnostics == []`.
- Sweep table (all 10 files) spot-verified: `rhythm/mod.rs` has zero remaining bare parses; `query.rs:37` bool-only + raw-key interpolation; `const_values.rs:144` / `ast_value.rs:243` `json!()` JSON channel; `fence_coerce.rs:61` / `fence_arith.rs:158,208` bool-only; `fence_eval.rs:137-140` explicitly finite-gated; `unary.rs:344` / `coerce.rs` atom-pipeline only, no declaration printer; `classify.rs:41` already `is_finite`-gated; `lexical.rs:66` the sanctioned entry (grammar pinned byte-identical to bare parse by `decimal_grammar_agrees_with_f64_parse`, so only non-finite results change behavior).
- Golden re-sweep `calc\((inf|NaN)` / `/ inf)` / `Infinity * var` / `inf * var` over reference-rs css/snap/json: **zero matches**.
- Stays-untouched: `get_rhythm`/`format_*` signatures, fragment scanning, epsilon-collapse, `denom == 0.0` (`1/0r` parity), `unit.rs`, `classify.rs`, legacy museum, class naming, `--spacing-root` — none in diff (confirmed). Quarantine addition is test-only, entailed by licensed close (a), with `ATM-TOKEN-16` precedent; 9 entries match the 9 refused declarations exactly.

## 5. Contracts-held

- ATM-VALID-02 + rule 10: no `inf`/`NaN` Rust-Display mint reachable from any `r` stem (gate is total over the emit path; sheet-text backstops green).
- Silence parity: legacy refuses silently; fix refuses silently (`diagnostics []` pinned, no warnings added).

## Verdict: VERIFIED

Commit-ready. No gaps.

## Notes

- The fortify's coherent-fix note (unit.rs sink chain via `lit.value.to_string()` recording, `/tmp/doom-r-sweep.mjs` evidence) is acknowledged as a scheduling signal for a follow-up doom cycle — explicitly out of this arc per the ruling's "stays untouched", not reviewed, not expanded.
- Oracle incident, fully repaired: a `git stash push` with a workdir-relative path failed while a bare `git stash pop` then partially applied another crew's `stash@{0}` (`sim-quarantine-pipeline`). Oracle immediately restored every touched tracked file to HEAD and removed the three materialized untracked files; both stash entries remain intact and no crew work was lost. Fail-without-fix was then proven with a `cp`-swap instead of stash.
