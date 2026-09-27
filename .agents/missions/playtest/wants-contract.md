# Wants-Contract Crew Log — W-35 clamp-or-warn (playtest mission)

Status: COMPLETE (2026-09-27)
Scope: `packages/reference-lib/src/components/Slider` + `packages/reference-lib/src/components/Splitter` (colocated tests/stories only) + ONE new shared doc under `packages/reference-lib/src/components/` + this log. Never switch branches (reference-system); never commit (captain commits).
Dep: B-29 landed (Slider render-path ARIA clamp + B-29 contract/ CT tests green).

## Plan

- Slider: keep B-29 clamp; ADD dev-only warn naming component, prop, value, valid range (the W-35 warn half; clamp-silently alone matches Radix/RAC/native per prior-art).
- Splitter: keep `validateLayout` dev warnings + FEATURES #9 structural throw; ADD dev warning on the count-mismatch path so the W-35 acceptance case (`value=[10,10,80]` on 2 panels) warns AND throws (never silent); no render clamp (warn-only per contract).
- Tests: unit (contract) + CT for both, React 19. Sync styles first.
- Shared doc: contract stated once + per-component policy + read-only audit (Tree/Listbox/NumberField/Calendar — fixes are follow-up crews).
- COMPLETE + report when suites green.

## Work log

- Opened log, read WANTS.md W-35 + PLAYTEST-REQUIREMENTS.md Part 2 W-35 + B-29/B-11 + prior-art W-35 rows.
- Confirmed B-29 clamp live in `Slider.tsx` (ariaNow clamp) with contract + CT coverage.
- Confirmed Splitter warns (bad entries/sums) + throws (count/structure) in src.
- Slider: added dev-only `warnSlider` + out-of-range check (scalar/array-entry, names component/prop/value/[min, max]); B-29 clamp untouched.
- Splitter: structure-effect now dev-warns with the diagnostic before the FEATURES #9 throw (count-mismatch path).
- Unit: W-35 contract tests (Slider warn 4-part + silence-in-range; Splitter off-100 warn + panels-mount, count-mismatch warn + throw); B-29 test silences the now-expected warning.
- E2E: Slider W-35 console test via `LoggedFixture`; new Splitter `BadLayout` story + W-35 console/no-collapse test (widths > 13px).
- Shared doc `packages/reference-lib/src/components/OUT-OF-RANGE.md`: contract, warning format, landed policy, acceptance mapping, read-only audit (NumberField/Calendar/Listbox/Tree — all need follow-up crews; zero edits outside scope).
- Sync + full `pnpm agentct` loops green (see Verdicts).

## Verdicts

| Check | Result |
|---|---|
| Slider unit (workspace React 19) | 44/44 pass, 0 failed |
| Slider e2e (React 19) | 36/36 pass, 0 failed (incl. new W-35) |
| Splitter unit (workspace React 19) | 33/33 pass, 0 failed |
| Splitter e2e (React 19) | 66/66 pass, 0 failed (incl. new W-35) |
| Snapshots | no drift (0 failed; no baselines touched) |
| Scope | 7 modified (Slider/Splitter only) + OUT-OF-RANGE.md + this log; reference-system; no commit |

## Files changed

- `packages/reference-lib/src/components/Slider/Slider.tsx` — `warnSlider` + W-35 out-of-range check
- `packages/reference-lib/src/components/Slider/Slider.contract.test.tsx` — W-35 test; B-29 noise silenced
- `packages/reference-lib/src/components/Slider/__e2e__/Slider.ct.spec.ts` — W-35 browser-console test
- `packages/reference-lib/src/components/Splitter/Splitter.tsx` — dev warning on structure-mismatch path
- `packages/reference-lib/src/components/Splitter/Splitter.contract.test.tsx` — 2× W-35 tests; resilient afterEach
- `packages/reference-lib/src/components/Splitter/Splitter.story.tsx` — `BadLayout` story
- `packages/reference-lib/src/components/Splitter/__e2e__/Splitter.ct.spec.ts` — W-35 warn/no-collapse test
- `packages/reference-lib/src/components/OUT-OF-RANGE.md` — NEW shared contract doc (audit table inside)

## Flags for HQ

1. Splitter count-mismatch now warns AND throws (was throw-only). Throw kept per FEATURES #9; warning makes the W-35 "dev warning" acceptance literal.
2. Audit: NumberField (render path), Calendar (selected-on-disabled), Listbox (silent no-selection), Tree (silent unknown-id passthrough) are all NON-COMPLIANT — routed in the doc to fields/calendar/combo-list/nav crews.
3. SSR edge (documented): count mismatch renders fallback geometry silently on the server; client warns + throws on hydration.
