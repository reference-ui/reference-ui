# Fields crew log (NumberField + Slider + Collapsible + Splitter)

Status: COMPLETE
Branch: reference-system (never switched; never committed — captain commits)

Scope: packages/reference-lib/src/components/{NumberField,Slider,Collapsible,Splitter} (+ colocated tests/stories) ONLY.

## Per-bug verdict

| Bug | Verdict | Notes |
|---|---|---|
| B-19 clamp-on-keystroke eats decimals | FIXED | Real input session: typing writes a draft only; commit at blur / Enter / step-action boundaries, never mid-keystroke. `min=1 max=10`, type `2.5` → one `onChange(2.5)`. Step actions use a complete dirty candidate as base; invalid text reverts; prevented blur vetoes commit; programmatic `value` change ends the session. |
| B-26 spinbutton role | FIXED | Input is plain textbox per NumberField.md/SPEC/PATCHES §8: `role="spinbutton"` + all numeric `aria-value*` removed; managed stripping now enforces their absence. |
| B-26 no hold-repeat | NOT-A-BUG (disproven) | Hold-repeat fully implemented (`useStepperRepeat`: immediate + 400ms + 60ms cadence, touch-cancel, pinch, re-entry); existing NF-STEP timing tests green. The `[reasoned]` claim was wrong. |
| B-26 `-Infinity` ARIA | FIXED | Gone with the `aria-value*` removal; SSR test pins no `Infinity` in markup. |
| B-29 Slider lying aria-valuenow | FIXED | Render path clamps `aria-valuenow/min/max` into the feasible window (mirrors `valueToPercent`); `formatValue` describes the exposed value. `value=999/max=24` → `aria-valuenow=24`. |
| B-12 Collapsible onOpenChange dropped | FIXED | Both handlers fire (`onChange` first, then `onOpenChange`); either alone behaves exactly as before. |
| B-28 Splitter prop leak | ALREADY-FIXED, regression-pinned | Current `src` destructures `min/max/collapsible/collapsedSize` (Sep-26 rework); new CT test mounts both constrained fixtures and asserts zero leaked attrs + zero prop-leak console errors. |
| B-30 aria-orientation | ALREADY-FIXED, verified | `src` renders perpendicular (`horizontal→vertical`, `vertical→horizontal`); existing SP-A11Y-01 sweep pins all five layout groups. Full Splitter suite green. |
| B-31 Enter-collapse no-op | ALREADY-FIXED, verified | `src` implements Enter collapse/restore with id-keyed memory (Sep-26); existing SP-COLLAPSE-01/02/03 + SP-END-02 green. |
| B-36 NumberField facet (identical-value re-emits) | ALREADY-FIXED, re-pinned under session engine | FEATURES #2 suppression intact (arrows/steppers/Home/End at bounds silent); commit path adds identical-candidate suppression; new session tests assert single/no-change emissions. |

## Files changed (10)

- `packages/reference-lib/src/components/NumberField/NumberField.tsx` — draft session, commit boundaries, textbox exposure
- `packages/reference-lib/src/components/NumberField/NumberField.test.tsx` — contract updates (NF-TYPE-03, NF-EDIT-13, FEATURES #2 text, NF-ENV-01) + 5 new B-19 session tests
- `packages/reference-lib/src/components/NumberField/NumberField.story.tsx` — new `BoundedDecimalFixture` (exact B-19 repro + request counter)
- `packages/reference-lib/src/components/NumberField/__e2e__/NumberField.ct.spec.ts` — textbox exposure asserts, commit-contract NF-EDIT-04, new B-19 keystroke test, wheel-test ARIA update
- `packages/reference-lib/src/components/Slider/Slider.tsx` — clamped render-path ARIA
- `packages/reference-lib/src/components/Slider/Slider.contract.test.tsx` — new B-29 SSR test (overflow/underflow/range)
- `packages/reference-lib/src/components/Slider/__e2e__/Slider.ct.spec.ts` — new B-29 CT test (LoggedFixture props)
- `packages/reference-lib/src/components/Collapsible/Collapsible.tsx` — fire both handlers
- `packages/reference-lib/src/components/Collapsible/Collapsible.test.tsx` — new B-12 test (both + solo)
- `packages/reference-lib/src/components/Splitter/__e2e__/Splitter.ct.spec.ts` — new B-28 leak test

No `Splitter.tsx` / `Collapsible` e2e / Slider story changes needed. No snapshot rebaseline (all `snap()` green — pixel-identical).

## Suites (test-component, React 19)

- NumberField unit: 34 passed / 0 failed (was 29; +5 B-19)
- NumberField e2e: 19 passed / 0 failed (incl. new B-19 keystroke test)
- Slider unit: 43 passed / 0 failed (was 42; +1 B-29)
- Slider e2e: 35 passed / 0 failed (incl. new B-29 CT test)
- Collapsible unit: 20 passed / 0 failed (was 19; +1 B-12)
- Collapsible e2e: 22 passed / 0 failed
- Splitter unit: 31 passed / 0 failed (untouched code; baseline held)
- Splitter e2e: 65 passed / 0 failed (incl. new B-28 test; Enter/orientation suites green)
- Typecheck: no NEW errors (repo has pre-existing errors incl. 2x `data-pressed` in NumberField.tsx, confirmed identical on pristine HEAD via stash)

## Flags for HQ

1. **Showcase e2e WILL break (out of scope, needs another crew):** `packages/reference-lib/src/components/Showcase/__e2e__/Showcase.ct.spec.ts:58` does `getByRole('spinbutton')` after stepping NumberField. B-26 removes the role. Remedy is one line but needs a scoped `textbox` query (page has multiple textboxes) — left for captain to route. Field e2e/story are safe (no typing into NumberField, no spinbutton asserts).
2. **PATCHES §8 half-open:** the spinbutton-removal half is done; §8's second half (unnamed-Input dev diagnostic) was NOT in the playtest scope and is still unimplemented.
3. **Flaky cold-start observed:** one Collapsible e2e run showed 9 failures + a timeout right after a daemon hiccup ("No component tests found" then mass fail); immediate rerun 22/22 green with zero code delta. Environmental, not a product signal.
4. **Video inspection unavailable:** this environment cannot render `.webm` artifacts (`read_file` rejects non-UTF-8). Motion risk is nil — no animation/visual change in this batch, and every `snap()` comparison passed pixel-identical.
5. **B-19 semantic note:** clamp still applies, but once at commit (not per keystroke). `commitBehavior` snap/validate (W-02) is a separate want on top of this session engine, owned elsewhere.
