IN PROGRESS — Tree reconciliation (quarantine-landing mission)

Crew lead for Tree. Branch: reference-system (never switch; quarantine tip 89850d1c8 read-only).
Dir: packages/reference-lib/src/components/Tree/

## Plan
1. Baseline `pnpm agentct Tree` before changes.
2. Diff quarantine Tree freeze commit b8b5f1aff (vs base 7aea45265) + matrix unit/e2e for tree.
3. Port ONLY stability + test-case wins; reject look-and-feel/visual changes; preserve current visuals.
4. Prove after with `pnpm agentct Tree`, view-story visual check, nested ux-designer review.

## Progress
- 2026-09-25: started. Confirmed dir `Tree/`.
- Baseline `pnpm agentct Tree` BEFORE changes: Unit 0 tests (none colocated), E2E 4/4 pass (react19), snapshots green.
- Triage done (quarantine `b8b5f1aff` + full matrix corpus read; TESTS.md verified as pre-quarantine contract, last touched at base).

## Triage (salvage vs suspect)
SALVAGE (source, all zero-paint):
1. forwardRef on Item/Group/Expander + composed refs (TR-DOM-07)
2. Auto branch detection from authored Group children, render-time scan (SSR-safe; quarantine used registration state which would mismatch hydration against our two-path branch/leaf DOM) (TR-DOM-03, TR-DYNAMIC-05)
3. aria-posinset/setsize via layout effects + MutationObserver (TR-DOM-05)
4. Duplicate identity detection, throws (TR-DOM-08)
5. Select idempotency: no onChange when value unchanged (TR-SELECT-03)
6. Expander disabled guard via closest treeitem (TR-EXPAND-09)
7. Focus recovery on removal incl. root tabindex=-1 fallback (TR-DYNAMIC-03)
8. getDeterministicExpanded export + document-order branch registration (TR-EXPAND-06)
9. RTL via closest('[dir]') (TR-KEY-06)
10. Alt/Ctrl/Meta guard in key handling (TR-KEY-11)
11. Typeahead via shared RovingFocus TypeaheadModel (landed API verified compatible) + Space-buffer rule (TR-TYPE-04)
12. Group id + Expander aria-controls; REMOVE expander aria-hidden (TR-DOM-11)
13. CSS.escape hardening in toggleExpanded queries (TR-EXPAND-07)
14. Remove dead unreachable input-guard in handleKeyDown (cleanup)
SALVAGE (tests): re-target 58 matrix e2e + 3 unit to CT + colocated unit (new Parity story mirrors quarantine fixture testids; Basic/MultiLevel untouched).
SUSPECT (do not port): controlled-only state deletion of defaultValue/defaultExpanded (recon exhibit 1; keep uncontrolled, re-target TR-DOM-10); Combobox bridge + TR-CB-01..06/COMP-03 (new cross-component feature, Combobox territory per TESTS.md "Owned elsewhere"; quarantine data-active=combobox-active would REGRESS our data-active=focus); TreeHierarchyModel + TR-DYNAMIC-01/02 unit (export unreferenced by quarantine component itself — test theater; dynamics proven via browser DYNAMIC-03..06); quarantine single-path branch DOM (flexWrap/inline children — visual restructure, frozen); Tree.book.tsx changes; SPEC "Resolved/Production Yes" claims.
SKIP with reason: TR-ENV-03 as written (vacuous — asserts no shadow behavior; will attempt a REAL shadow CT, else skip); quarantine fall-through key handling for non-editable descendants (out-of-scope rows per TESTS.md; current early-return passes KEY-10).
- Source ports implemented (14 items); `tsc --noEmit` clean for Tree (only pre-existing Slot/Tabs errors in other crews' files).
- Parity story added (mirrors quarantine fixture testids + deterministic/refs/noop sections); Basic/MultiLevel untouched. CT suite: 4 existing (KEY-01 + DOM-02 extended with tabindex/level asserts) + 48 new = 52. Colocated `Tree.test.tsx`: 3 unit (EXPAND-06, ENV-01, ENV-02).
- Post-change proof: `pnpm agentct Tree` 52/52 E2E + 3/3 unit (react19); `--e2e --react all` 156/156 (17/18/19). Snapshots unmodified, all green.

## Surprises
- TYPE-04/05 failed 3 runs at identical points; root-caused via temp debug spec (since deleted) with activeElement/tabindex dumps: `\p{Emoji}` matches ASCII digits, so "0 backups" stripped to "backups" and hijacked 'b' searches (focus landed on tree-item-zero). Fixed `extractTypeaheadText` with a digit carve-out (1 line) + pinned via a '0'-search assertion in DOM-08. This is a genuine fix beyond quarantine (their fixture had no digit-leading labels). Model logic verified separately against the real TypeaheadModel via node --experimental-strip-types sim in /tmp.
- EXPAND-09: Playwright treats aria-disabled descendants as unactionable, so the disabled expander click needs `force: true` (real click still ignored by the guard).
- DOM-07: refs-tree needs `defaultExpanded` or its Group never mounts for the callback-ref probe.
- One full-suite run was poisoned by infra (9 mount TIMEDOUTs: `window.mount` never initialized + Vite "Failed to fetch dynamically imported module" for the story — concurrent-crew HMR churn on the shared daemon); clean on re-run. Result dirs get wiped by concurrent crews, so artifacts must be read immediately.
- Typeahead expiry waits use 2500ms (5x the 500ms contract) for loaded-CI margin; TYPE-04 restructured to 2 timing dependencies instead of 4 with identical observables.
- ENV-03 skipped without attempt (matches Switch SW-ENV-03 skip): shadow-portal key events hit React container-delegation retargeting (native target retargets to the host, so item handlers never fire) — lib-wide framework concern, not Tree stability.
- Tree.md line 70 ("Omitted value/expanded means controlled null/empty") was already false before this landing (implementation has uncontrolled); left untouched per minimal-churn/Switch precedent — flagged for captain.
- view-story visual check: Playwright MCP pipe broken (environmental, 2x broken-pipe); fell back to `pnpm capture` per skill. FileExplorer resting/selected/collapsed + CollapsedByDefault + StatelessExpander all render correctly; expander collapse works with selection retained; named 'Collapse' button found (aria-hidden removal verified live).
- Nested ux-designer review: SIGN-OFF (spawn accepted first try; read-only brief).

## Handoff: UX verdict (nested)
SIGN-OFF. Look: PASS, zero drift (15 baselines byte-identical, none re-pinned; live captures correct). Feel: all 13 APPROVED — auto-detect, posinset/setsize, duplicate-throw, idempotent select, disabled-expander guard, focus recovery, deterministic order, dir-RTL, modified-key guard, shared TypeaheadModel + Space rule, aria-controls + aria-hidden removal, uncontrolled preserved, digit carve-out — plus forwardRef/CSS.escape hardening; no behavior loss; dead-guard removal safe. A11y: expander AT-exposure fix is the biggest win; posinset verified live (decorative excluded); focus recovery + modified-key guard approved; minor note (not a finding): posinset emitted on fully-rendered levels too — harmless. Artifacts: empty snapshot diff, full Tree.tsx diff, 5 captures + live ARIA probe; videos uninspected (dirs wiped by concurrent crews).

## Commit-ready arc
Files: `Tree.tsx` (14 hardening ports, zero paint), `Tree.story.tsx` (+Parity story; Basic/MultiLevel byte-identical), `__e2e__/Tree.ct.spec.ts` (4 existing kept, KEY-01/DOM-02 extended with asserts only, +48 parity cases), `Tree.test.tsx` (new, 3 unit), `SPEC.md` (status/index/landing note; 54/64 [x]). No snapshot changes, no book changes, no public API removals (one additive export: `getDeterministicExpanded`). Branch: reference-system throughout; no commits made (captain lands one commit per component).

COMPLETE
