# RovingFocus PATCHES crew log

Status: IN PROGRESS

Branch: reference-system (never switch; never commit).
Scope: PATCHES.md #1 only (capture-phase Space typeahead guard, RF-TYPE-06 CT).
Guardrails: API-STANCE (breaking changes ONLY as written — this item adds no API);
visuals frozen (headless; any snapshot change = STOP and flag).
Touch: RovingFocus dir + this log only; read-only elsewhere.

## Plan
1. Read TESTS.md conventions, unit tests, CT fixture helper; check quarantine 088e4a70c.
2. Implement capture-phase Space guard in RovingFocus.tsx if a mechanical remainder exists.
3. Add RF-TYPE-06 CT browser case (separate story fixture; existing fixture/snapshots untouched).
4. Prove: pnpm agentct RovingFocus (unit + e2e green).
5. Nested ux-designer review of delta.
6. COMPLETE + report.

## Work

- PATCHES #1 only item. Quarantine 088e4a70c capture handler read: consumer
  capture first, then `typeahead && key===' ' && hasBuffer` ->
  preventDefault + stopPropagation + handleTypeaheadChar(' '). NOTE:
  stopPropagation is DECLINED by DECISIONS #7 (breaks RF-NEST-02) — never
  reintroducing it; preventDefault alone cancels button activation.
- Current-tree analysis: bubble `handleTypeahead` (RovingFocus.tsx:327-349)
  already preventDefaults Space-with-buffer and matches. Standard
  `onKeyDown` preventDefault cancels native Space button activation, so the
  behavior may already hold; capture would add no observable remainder.
  Empirical check first: write the RF-TYPE-06 CT case, run against current
  code, then decide src change vs already-resolved.
- Added `RovingFocusSpaceFixture` (append-only; main fixture untouched):
  Blueberry vs "Blue Berry" + activation counter.
- Added RF-TYPE-06 CT + empty-buffer complement (no snap calls — zero new
  baselines, existing snapshots must stay green).

## Evidence

- `pnpm agentct RovingFocus`: Unit 27 passed; E2E 8/8 react19 (all 10
  pre-existing snapshots green, zero new baselines).
- `pnpm agentct RovingFocus --e2e --react all`: 24/24
  (react17/18/19 × 8).
- Screenshots confirm end states: focus ring on "Blue Berry" + counter 0
  (RF-TYPE-06); focus on "Blueberry" + counter 1 (complement).
  Videos exist but this environment cannot play binary video — judged from
  screenshots + assertions (flagged, both by me and UX reviewer).
- SPEC.md case index: RF-TYPE-06 moved to [x] per legend.

## Verdict on PATCHES #1

ACCEPTANCE MET with NO shipped-source change. RF-TYPE-06 passes as a CT
browser case on react19 (and 17/18): space-containing label matched, zero
activations. The capture-phase mechanism has no mechanical remainder
against the current tree: bubble `handleTypeahead` already preventDefaults
Space-with-buffer before matching, and same-event preventDefault cancels
native button activation in every phase. Capture ordering adds nothing
observable (consumer handlers run in both designs); the stopPropagation
half stays out per DECISIONS #7 DECLINED (breaks RF-NEST-02). Item
verified-as-resolved; proof artifact is the new CT case. No API change, so
API-STANCE is untouched.

## UX review (nested, ux-designer method): PASS / approve

- Look: no change, frozen confirmed (diff = story append + spec append +
  SPEC line; RovingFocus.tsx untouched; zero snapshot files touched).
- Feel: Space-with-buffer consume APPROVED; Space-without-buffer native
  activation APPROVED (complement pins no behavior loss).
- A11y: no findings (visible focus, exactly-one-tab-stop, APG Space
  semantics, honest toolbar role).
- Artifacts: git diff, both end-state screenshots, CT assertions,
  RovingFocus.tsx:327-349. Full text in reviewer session log.

## Files changed

- packages/reference-lib/src/components/RovingFocus/RovingFocus.story.tsx
  (+69, appended RovingFocusSpaceFixture; existing fixture untouched)
- packages/reference-lib/src/components/RovingFocus/__e2e__/RovingFocus.ct.spec.ts
  (+51, appended PATCHES #1 describe: RF-TYPE-06 + complement)
- packages/reference-lib/src/components/RovingFocus/SPEC.md
  (RF-TYPE-06 → [x] index line)
- RovingFocus.tsx, typeahead.ts, index.ts: UNTOUCHED (no remainder).
- Snapshots: none changed, none added.

Status: COMPLETE
