# Announcer P1b micro-crew — consumer migration + PATCHES #1 drop

Branch: reference-system (never switch; never commit).
Touch ONLY: Announcer dir + Toast CT spec + ReferenceLibrary CT spec + this log. Read-only elsewhere.

## Inputs (read)
- `packages/reference-lib/src/components/Announcer/PATCHES.md` #1: remove both `data-testid` attributes; `data-reference-announcer="polite"|"assertive"` becomes the only selector. Acceptance: Toast/RL/matrix tests assert contract selectors only; ANN-DOM-05 retired; no `data-testid` in Announcer host output.
- `.agents/missions/quarantine-landing/patches-Announcer.md` (Announcer-F crew): item 1 BLOCKED on trigger — Toast CT 12 sites + RL CT 1 site still select via testid (both files read-only for that crew). Item 2 landed.
- `docs/MISSIONS/API-STANCE.md`: no V2; breaking NOW pre-release; in-repo consumers migrate in the same change.
- `test-component` skill (read); `ux-designer` skill (read).

## CHECKPOINT PLAN
1. Migrate 13 spec sites to contract selector `page.locator('[data-reference-announcer="polite"|"assertive"]')`:
   - Toast CT: 1053, 1054 (const declarations), 1130, 1172, 1328, 1329, 1334, 1379, 1394, 1423, 1426 (shadow-root querySelector), 1441.
   - RL CT: 40.
   - Why attribute-locator, not getByRole: SAME-behavior rule. Fixtures contain other `role="status"` nodes (e.g. Toast `sib-status`); `getByRole('status')` could match extra nodes and change assertion semantics. The PATCHES-named contract selector is `data-reference-announcer`, which is 1:1 with the old testids.
2. Drop both `data-testid` attributes in `Announcer.tsx` (L281, L290). Retire ANN-DOM-05 migration assertion if present in touched scope.
3. Search matrix + rest of tree for remaining Announcer-testid consumers (read-only; flag if found).
4. Prove: `pnpm agentct Announcer` + `pnpm agentct Toast` + `pnpm agentct ReferenceLibrary` all green. Visuals frozen — STOP+flag if any snapshot change required.
5. Nested ux-designer review (spawn; if pool-full, self-review by the method and flag).

## Log
- [x] header written; branch confirmed reference-system; starting reads
- read Announcer.tsx (testids L281/L290), Toast CT 13 sites, RL CT L40, SPEC defect 5 + ANN-DOM-05, TESTS ANN-DOM-05
- consumer search: NO matrix/other consumers — only Toast CT (12), RL CT (1), Announcer.tsx (source), SPEC.md (docs). Trigger satisfiable in scope.
- ANN-DOM-05 retirement: no executable assertion exists (no Announcer __e2e__; not colocated in Announcer.test.ts; case text is conditional "If data-testid aliases remain..." — vacuously retired by the drop). No code/test edit required beyond the alias removal. Docs (SPEC defect 5, TESTS checkbox, PATCHES item) left for doc-owning crews — code change exactly per PATCHES #1.
- MIGRATED 13/13 spec sites via sed to `page.locator('[data-reference-announcer="polite"|"assertive"]')` + 1 shadow-root querySelector; verified: zero remaining `*-announcer` testid refs in either spec; assertions untouched (same text/attr/visibility/count checks)
- DROPPED both data-testid attributes in Announcer.tsx (2-line diff); grep confirms zero `testid` in Announcer.tsx
- running proof: pnpm agentct Announcer + Toast + ReferenceLibrary
- PROOF Announcer: unit 15/15 pass; e2e 1/1 pass (react19; NOTE: sibling crew has since added `Announcer/__e2e__/Announcer.ct.spec.ts` using contract selectors already — it passed post-drop unmodified)
- PROOF ReferenceLibrary: e2e 3/3 pass (react19, incl. migrated RL-DOM-02); unit 0 tests
- PROOF Toast: unit 52 pass; e2e 60/60 pass (react19, incl. all migrated TO-ANN/TO-A11Y/TO-ANN-08/TO-ENV-03/TO-ENV-02 sites)
- visuals frozen: zero snapshot files touched (git status clean on all __snapshots__); no STOP triggered
- NESTED UX REVIEW (child 01a0ded4-876a-7331, ux-designer method, read-only): **APPROVE**. Look PASS (2-line attribute-only diff; roles/live/styles/DOM byte-identical; host visually-hidden, no snap surface). Feel: no behavior changes, nothing to rule. A11y: ARIA contract (status/alert, live, atomic) intact. Artifacts: 3-file diff, host JSX L260-294, zero-straggler searches, suite results as engineering proof. No self-review — nesting succeeded.

## Result
- Migration 13/13 LANDED (Toast CT 12 + RL CT 1) — contract selectors only, assertions byte-identical in behavior.
- PATCHES #1 drop LANDED — both `data-testid` aliases removed from `Announcer.tsx`; zero `testid` in Announcer host output; ANN-DOM-05 executable retirement N/A (conditional doc case, vacuously retired).
- Proof: 3/3 suites green (see above). Branch untouched (reference-system, no commit).
- UX: nested APPROVE (see above).
- Files changed (mine only): `packages/reference-lib/src/components/Announcer/Announcer.tsx` (-2), `packages/reference-lib/src/components/Toast/__e2e__/Toast.ct.spec.ts` (12 lines), `packages/reference-lib/src/components/ReferenceLibrary/__e2e__/ReferenceLibrary.ct.spec.ts` (1 line), this log.
- Flags: (1) SPEC.md defect 5 + TESTS.md ANN-DOM-05 checkbox + PATCHES.md item-1 status text still describe the aliases as present — left untouched per "exactly per PATCHES #1" code scope; doc-owning crew should close them. (2) Sibling crews have uncommitted changes across the tree (Menu/Overlay/Slider/etc.) — mine are the 3 files above only.
