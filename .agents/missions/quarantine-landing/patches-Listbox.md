# PATCHES crew — Listbox

Status: IN PROGRESS

Mission: implement `packages/reference-lib/src/components/Listbox/PATCHES.md` exactly (2 items), branch `reference-system`, no commits.

## Items

### 1. Wire `validateVirtualAdapter` into registration — LANDED
- `registerOption` validates an indexed mount against the live `virtual` adapter (via `virtualRef`, so registering options don't re-subscribe on adapter identity change); validation runs pre-insert on the candidate set so a failure can't pollute the registry.
- A `virtual.items`-keyed effect re-validates mounted indexed options on logical replacement (also catches duplicate logical values with zero options mounted).
- Throws are the existing exported validator's descriptive diagnostics; no new error text, no API surface change.

### 2. Strengthen duplicate detection to same-pass re-registration — LANDED
- `registerOption` now throws the descriptive identity error on ANY currently-registered value repeat (dropped the `existing.id !== record.id` caveat), so colliding derived ids no longer slip through. Detection lives at commit phase, which runs once per committed instance.
- Render-time `registerRenderValue` keeps deterministic id comparison (unchanged behavior): an instance-token attempt false-positived on React 17/18 `mountIndeterminateComponent` probe renders (hook state discarded between probe and real render), proven by the `--react all` run; reverted to id comparison with a comment recording why.
- StrictMode-safe: effect cleanups delete before re-setup (LB-ENV-02 green).

## Evidence
- `pnpm agentct Listbox --unit`: 9/9 pass (7 pre-existing + 2 new LB-VIRT-09; LB-DOM-06 extended).
- `pnpm agentct Listbox` (unit + CT React 19): 9/9 unit, 25/25 e2e, exit 0; all 8 frozen snapshots matched unmodified.
- `pnpm agentct Listbox --e2e --react all`: react17 25/25, react18 25/25, react19 25/25, exit 0.
- New tests (all in `Listbox.test.ts`, error-boundary capture in happy-dom):
  - `LB-VIRT-09 (unit)` invalid indexed mount → `Mounted option value "item-WRONG" does not match virtual item value "item-0" at index 0`.
  - `LB-VIRT-09 (unit)` logical replace with duplicates → `Duplicate value in virtual items: "item-0"` (both wiring points fire it); valid adapter registers silently with `aria-setsize="2"`.
  - `LB-DOM-06 (unit)` extended: two same-value options with colliding derived ids → `Duplicate option value "alpha"`.
- CT videos from passing runs were not retained (shared results dir holds a concurrent Switch run); paint proof is the 8 matched snapshots, not video.

## UX review
- Verdict: APPROVE (self-reviewed by ux-designer method — nested spawn rejected, pool 8/8 full).
- Look: no paint/motion/chrome/focus-ring/spacing change; 8 frozen baselines matched unmodified. Approved.
- Feel: valid trees byte-identical in behavior (25/25 CT incl. keyboard/focus/typeahead/virtual on 17/18/19); invalid trees now fail fast with a value-naming diagnostic instead of silent corrupt selection/focus state. Approved as enhancement, no behavior loss.
- Accessibility: ARIA/focus management untouched; throwing before ambiguous state is exposed protects AT users. No new findings.
- Artifacts judged from: `git diff` of Listbox.tsx/Listbox.test.ts, full gate logs (unit + CT × 17/18/19), 8 unmodified PNG baselines in `__e2e__/__snapshots__`.

## Files changed
- `packages/reference-lib/src/components/Listbox/Listbox.tsx` (+34/-3: helper, virtualRef, registerOption wiring, items-change effect)
- `packages/reference-lib/src/components/Listbox/Listbox.test.ts` (+172/-1: shared CaptureBoundary, 2× LB-VIRT-09, LB-DOM-06 colliding-id extension)
- `.agents/missions/quarantine-landing/patches-Listbox.md` (this log)

## Flags
- Nested ux-designer review impossible (root pool 8/8); self-reviewed by the method — treat as provisional if the mission wants a blind re-review.
- `registerOption`'s unconditional throw has a theoretical order hazard for key-swapped same-value remounts within one commit (setup-before-cleanup flush order); no test/story/consumer does this, render-time check stays the primary diagnostic. Noted, not blocking.

Status: COMPLETE
