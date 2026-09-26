# PATCHES DateField P2 shadow-remainder — crew log

Branch: reference-system (never switch; never commit).
Scope: packages/reference-lib/src/components/DateField/* + this log only. Read-only elsewhere (Overlay dir read-only).
Contract: PATCHES.md #7 EXACTLY. Breaking ONLY as written. Visuals frozen (snapshots unmodified; STOP+flag if visual change required).
Proof: pnpm agentct DateField (unit+e2e green, test-component skill). UX: nested ux-designer review.
Parent verdict: patches-DateField.md #7 BLOCKED on "Overlay shadow-portal contract" (Overlay had zero shadow code; Overlay PATCHES empty).

## Timeline
- START header written
- RECON done (PATCHES #7, parent verdict, API-STANCE, test-component + ux-designer skills, portal-container.ts, Content/Backdrop wiring, Portal fragment support, DateField.md scoping promise, quarantine titles via git show 1150c8e6e, OV-ENV-05 pattern, DateField spec/story)
- VERDICT #7 UNBLOCKED: Overlay FEATURES #1 (automatic getRootNode rule, portal-container.ts + Content.tsx:188 + Backdrop.tsx:92, proven by OV-ENV-05) is exactly the shipped shadow-portal contract; DateField passes no explicit container so the rule applies; Portal accepts DocumentFragment; quarantine titles retrieved; landing is test-only per "zero DateField design"
- LAND #7 tests: ShadowFormFixture + ShadowPickerFixture (createPortal into open ShadowRoot, Overlay exotica pattern); DF-ENV-01 (shadow input count + type publishes + same-tree submit ISO) + DF-COMP-04 (deliberate activation + portal destination in shadow not body + Escape + trigger/day commit bubbling); SPEC.md 19/64 accounting; DateField.tsx untouched
- BEFORE pnpm agentct DateField (unit+e2e)
- AFTER run1: E2E 11/22 (infra: story-module fetch errors under crew contention) + Unit 28/28; DF-ENV-01 + DF-COMP-04 PASSED
- AFTER run2: E2E 21/22 + Unit 28/28; only red = FEATURES #3 proof (line 408, `element is not enabled` on out-of-range day — Calendar HEAD isDateDisabled vs committed proof; HEAD-level sibling interaction, NOT this item; DateField.tsx/book.tsx deltas are another crew's, Calendar clean)
- AFTER run3 (isolated line 392): FEATURES #3 still red, same cause — confirmed not load flake
- LAND #7 proof: DF-ENV-01 + DF-COMP-04 green 2/2 runs; 8 frozen snapshots pass unmodified (git-clean); tsc zero DateField errors
- START artifacts + nested ux-designer review
- ARTIFACTS: both test-finished PNGs viewed (ENV-01: 2024-05-15 + payload birthday ISO; COMP-04: committed 2026-08-25, picker dismissed, trigger intact); webm unviewable in env (same as parent crew); earlier test-results cleaned by concurrent crews, regenerated via -g ShadowRoot 2/2 green
- LAND UX review: PASS (subagent 01a0dec7, read-only) — Look PASS (no paint delta, source untouched); Feel all 4 approved (deliberate activation, portal destination, commit/dismiss bubbling, shadow form association); A11y no findings + 1 observation (APG attrs in shadow inferred from CAL-01, optional 2-line close-the-loop)
- SCOPE CHECK: touched story.tsx (+2 fixtures) + spec (+2 proofs) + SPEC.md + this log ONLY; book.tsx/DateField.tsx deltas are sibling crews' (verified via diff); snapshots git-clean; never switched branch; never committed
- COMPLETE: #7 LANDED (was blocked, Overlay #1 unblocked); proof green; UX PASS

## Flags for the landing captain
- FEATURES #3 proof red at HEAD level (NOT this item, NOT fixed per touch-nothing-else): `DateField.ct.spec.ts:408` clicks out-of-range day `2026-08-05` but Calendar HEAD renders it disabled (`isDateDisabled`, committed FEATURES-B) → `element is not enabled` until 30s timeout. Reproduces in isolation. Needs a DateField-features/Calendar-features contract call (disabled-unclickable vs clickable-rejected) — the features-DateField crew owns the proof.
- UX observation (non-blocking): COMP-04 does not re-assert APG attrs in shadow; inferred from CAL-01. Optional 2-line `aria-expanded` assertion if a future mission wants it closed.
