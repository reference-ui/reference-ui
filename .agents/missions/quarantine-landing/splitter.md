COMPLETE — Splitter crew (quarantine-landing), branch reference-system, quarantine tip 89850d1c8 read-only (never committed; no branch switch)

## Scope
- Dir: packages/reference-lib/src/components/Splitter/ (confirmed `Splitter`, capital S)
- Quarantine commit: c7bdd1f7c `feat(splitter): freeze Splitter component and prove SPEC cases`
- Recon: Splitter.tsx 978/467 rewrite (SUSPECT), splitterMath.ts ADDED +552 (salvage candidate), unit +512, e2e +1106

## Progress
- 2026-09-25: crew start. Read LANDING.md, QUARANTINE_RECON.md, test-component skill.
- Baseline `pnpm agentct Splitter`: unit 0 tests (no colocated file), e2e 2/2 GREEN (react19).
- Recon analysis: quarantine c7bdd1f7c = Splitter.tsx rewrite (SUSPECT) + splitterMath.ts +552 (salvage) + unit +512 + e2e +1106 (encode mangled API: required value, min/max rename, Thumb drop — re-target, don't copy). Matrix splitter specs do NOT exist on this branch (same as Slider). Slider crew pattern adopted: verbatim math + colocated tests + minimal wire, uncontrolled API retained.
- Plan: (1) splitter-math.ts verbatim; (2) splitter-math.test.ts SP-MATH-01..12 + SP-COLLAPSE-07/08; (3) Splitter.contract.test.tsx SP-TYPE-01 re-targeted to current API + SSR; (4) minimal Splitter.tsx wire: honor minSize/maxSize/collapsible (currently dead props), solver-based adjust/drag/Home/End, no-op onChange/onChangeEnd suppression, honest separator ARIA, dev validateLayout warning; (5) Constrained/Collapsible stories + re-targeted CT (SP-DOM-03, SP-KEY-04, SP-CTRL-06, SP-END-01/03, SP-COLLAPSE-04); (6) SPEC.md honest counts.
- NOT porting: controlled-only value, min/max prop rename, Thumb removal, CSS-var hot path (SP-PERF), RTL wiring (SP-KEY-05), Enter collapse, string/measured constraints, anatomy throws. Default min floor stays 5% (shipped clamp preserved; quarantine default 0 NOT adopted).

## Surprises
- SP-END-01 first failed with end-count 0 (drag moved layout, change-count 8): the final pointerup solve is element-equal to the already-committed layout, so naive no-op suppression swallowed onChangeEnd. Fixed: final event of a session whose origin differs from current value still fires onChangeEnd once. Real stability fix, CT-pinned.
- Playwright MCP broken in this session (stdio Broken pipe ×2) — view-story done via `pnpm capture` fallback (declared). Nested ux-designer hit the same and also used captures.
- Nested reviewer misread the pixel gate ("no toHaveScreenshot in CT spec"): `snap()` in playwright/ct.ts:114 IS toHaveScreenshot — the 7 frozen baselines are automated-enforced on react19 and passed unmodified. Correction filed here, no code touched (ct.ts is out of scope).
- tsc --noEmit: 7 errors, all pre-existing in untouched files (playwright/ct.ts, Listbox/Slot/Tabs tests); zero in Splitter; @ts-expect-error directives live.

## Handoffs
- Matrix re-target: quarantine's 68 e2e + 15 unit splitter cases have no home on this branch (matrix/lib splitter specs don't exist); CT/unit colocated proof is 8 + 16, honest SPEC count 24/83.
- Deliberately not ported (future work, not regressions): controlled-only value, min/max prop rename, CSS-length constraints, RTL wiring (SP-KEY-05), Enter collapse (SP-COLLAPSE-01..03), CSS-var hot path (SP-PERF), anatomy throws, drag denominator SP-MATH-11 (component keeps full-rect denominator = shipped drag feel).
- UX pre-existing non-blockers (from nested review): 9px handle < 24px target minimum (keyboard-mitigated), no prefers-reduced-motion on 150ms transitions, no default separator accessible name.

## Result
- Baseline: unit 0 tests, e2e 2/2 green. Final: `pnpm agentct Splitter` unit 16/16 + e2e 8/8 green on UNMODIFIED baselines (react19).
- Files: +splitter-math.ts (byte-identical to quarantine), +splitter-math.test.ts (14), +Splitter.contract.test.tsx (2), M Splitter.tsx (solver wire, honest ARIA, no-op suppression, dev warnings), M index.ts (math re-export), M Splitter.story.tsx (+Constrained, +CollapsibleDemo), M __e2e__/Splitter.ct.spec.ts (+6 CT), M SPEC.md (24/83 honest).
- UX verdict: SIGNED (nested ux-designer, look PASS + 4/4 feel approvals + a11y improved).

COMPLETE
