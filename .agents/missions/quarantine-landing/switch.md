IN PROGRESS — Switch reconciliation (quarantine-landing mission)

Crew lead: Switch. Branch: reference-system (never switch; quarantine tip 89850d1c8 via read-only git only; no commits).
Dir confirmed: packages/reference-lib/src/components/Switch/

## Mission brief
- Read: docs/MISSIONS/LANDING.md (Obj B: visuals frozen, interactions reviewable, UX sign-off + green tests) + QUARANTINE_RECON.md (salvage/suspect split, mangling exhibits).
- Recon on Switch (`7bed212af`): Switch.tsx 80/45, no colocated test change; matrix unit +207, e2e +367.
- Mangling exhibits touching Switch: (1) uncontrolled mode deleted — defaultChecked + internal state dropped, `checked` required; (2) motion stripped — Thumb lost inline translateX + transition; (4) probing scaffolding added (Symbol.for('@reference-ui/Switch.Thumb'), __referencePart, hasStructuralThumb fragment-walker).
- Rule: port ONLY stability + test-case wins; quarantine look-and-feel/visual changes are SUSPECT — preserve current visuals.

## Progress
- [x] Dir confirmed, skills read (test-component, view-story, ux-designer), mission docs read.
- [x] Baseline `pnpm agentct Switch` BEFORE changes: Unit 0 tests (none colocated), E2E 2/2 pass (react19), snapshots green.
- [x] Triage done (quarantine `7bed212af` + matrix corpus read in full).

## Triage (salvage vs suspect)
SALVAGE (test-case wins, re-targeted to preserved API):
- Unit: SW-TYPE-01 (re-targeted: defaultChecked intentionally allowed + pinned), SW-ENV-01 (SSR asserts + hydrate-then-click), SW-ENV-02 (StrictMode + refs + one request).
- CT: SW-DOM-01..07, SW-ACT-01..07, SW-ACT-08 (re-targeted: controlled-without-onChange stays put; uncontrolled-without-onChange toggles by design), SW-NAME-01/02, SW-ENV-04, SW-A11Y-01, SW-COMP-02.
SUSPECT (do not port): required-`checked` (keep uncontrolled, recon exhibit 1); motion strip (keep thumb transform/transition, exhibit 2 + frozen visuals); Symbol/fragment-walker probing (exhibit 4); bare-Span fallback; SPEC "Resolved" API claims; book CheckedByDefault removal.
SKIP with reason: SW-DOM-08 (StyleProps-isolation asserts; quarantine e2e version only re-proves DOM-04 swap), SW-COMP-01 (covered by existing CT + ACT-03 + NAME-01), SW-ENV-03 (synthetic shadow-DOM harness, not lib behavior), SW-COMP-03 (Overlay/RovingFocus territory).
STABILITY (source, zero visual change): (1) SwitchThumb forwardRef (enables DOM-04/DOM-05/ENV-02 ref asserts); (2) runtime strip of consumer `aria-pressed` (Switch.md: Root owns its absence); (3) managed-wins spread order so conflicting consumer `data-state`/`aria-checked` are ignored (DOM-02 title verbatim). Types untouched (no public API churn); className/style passthrough preserved.
- [x] Implement: Switch.tsx hardening, story ParityFixture, CT cases, colocated unit (ssr/types/Switch.test), SPEC.md bookkeeping.
- [x] Post-change proof: `pnpm agentct Switch` 22/22 E2E + 4/4 unit (react19, snapshots unmodified); `--react all` 66/66 (17/18/19); `tsc --noEmit` zero Switch errors (4 pre-existing errors in playwright/ct.ts + Slot.test.tsx, untouched files).
- [x] view-story visual check: Default/CheckedByDefault/Disabled all render; atomic click proves toggle (aria-checked=true, thumb translateX 20px, transition intact); console 0 errors (4 generic Book-shell css warnings, unrelated).

## Surprises
- SW-DOM-04 `toBeVisible` on extra child failed: themed track clips extra authored children (matrix page was unstyled). Re-targeted to presence+text; SPEC Landing note records it. Observation for UX: extra child text becomes the switch's accessible name (a11y tree showed `switch "Extra Visual"`).
- Book HMR flapped 3× during MCP viewing (concurrent crews); worked around with atomic evaluate. Checked-state screenshot kept racing reloads — checked paint proven by unmodified `switch-checked.png` snapshot instead.
- CT videos unviewable here (read_file rejects binary; result dirs also get wiped by concurrent crews). Motion verified via live computed-style check + settled snapshots, not video frames.
- [x] Nested ux-designer review sign-off (spawn blocked 3× by root capacity 8/8; 4th attempt accepted).

## Handoff: UX verdict (nested, read-only)
Verdict: **SIGN-OFF**. Look: PASS, no drift (7 baselines unmodified; live paint matches; transition string byte-identical; focus ring + disabled match). Feel: all 5 APPROVED — (1) Thumb forwardRef (pure capability add), (2) aria-pressed runtime strip (invalid on role=switch; verified absent live), (3) managed-wins spread order (prevents dishonest state; passthrough preserved), (4) uncontrolled preserved, (5) motion preserved. Live-verified: controlled toggle, Tab reach, Space toggle, disabled inert + unfocusable. A11y: F1 advisory pre-existing (extra-child text enters accessible name while visually clipped — recommend doc note; not a regression, does not fail contract); healthy otherwise; 0 console errors. Artifacts: 3 Book story URLs, 7 snapshot baselines, CT spec + Switch.tsx diff.

## Commit-ready arc
Files: `Switch.tsx` (3 hardening edits), `Switch.story.tsx` (+ParityFixture), `__e2e__/Switch.ct.spec.ts` (+20 cases), `ssr.test.tsx`/`Switch.test.tsx`/`types.test.tsx` (new, +4 unit), `SPEC.md` (status/index/landing note). No snapshot changes, no book changes, no type-surface changes. Branch: reference-system throughout; no commits made (captain lands one commit per component).

COMPLETE
