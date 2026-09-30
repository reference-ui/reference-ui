DONE — RED-MB (Menubar React 17/18 majors) opened + closed 2026-09-29. All 18 fixed green, no holds.
Box: 90 min hard; stop new fixes at 75 min. Sibling crew owns Tooltip/ + Overlay trap code — I own ONLY Menubar/ + RovingFocus/.
Scope: 18 reds on `pnpm agentct Menubar --e2e --react 17,18` (r17 9 + r18 9: MB-DOM-01, MB-KEY-02/03/04/05/06/09, MB-FOCUS-01, MB-RTL-01 + ±1 flip-flopper).

## T+0 — baseline run launched
- Tree: branch reference-system, `git status --short` clean (C-NAME committed by captain).
- Baseline: `pnpm agentct Menubar --e2e --react 17,18` → /tmp/red-mb-baseline.txt

## T+15 — baseline: exactly the owned 9×2, zero flip-flopper
- `E2E: 46 | Passed: 28 | Failed: 18` / `react17: 14 passed | 9 failed` / `react18: 14 passed | 9 failed`
- Failing names (grep-verified, 18/18): MB-DOM-01, MB-KEY-02/03/04/05/06/09, MB-FOCUS-01, MB-RTL-01 × r17+r18.

## T+40 — ROOT CAUSE PROVEN (H1: ref-through-plain-function dies on 17/18)
- DIAG-01 (r17 console): `[error] Warning: Function components cannot be given refs. ... Check the render method of RovingFocus.Item. at PopoverTrigger` + all three triggers `tabindex=-1`.
- Mechanism: `RovingFocusItem` does `cloneElement(child, {ref: chained})` where child = `<Popover.Trigger>` (plain function, Popover.tsx:497). React 17/18 strips `ref` (special prop) → chained callback never fires → BOTH the kernel `itemRef` AND Menubar's `nodeRef` stay null.
- DIAG-03/04 fiber probes (r17): `rootCurrentId=null`, all `itemRef.current=NULL`, `claimed=rf-item-1` vs `mapKeys=[rf-item-2,rf-item-4,rf-item-6]`.
- DIAG-05 census + DIAG-06 timeline: 6 Item renders (odds visible, evens committed), registers {2,4,6}, zero unregisters — single commit. Cause of ghost claim: gallery wraps every story in `<React.StrictMode>` (main.tsx:29); React 17 StrictMode double-invokes render (visible pass claims rf-item-1, suppressed pass commits rf-item-2). Ghost is harmless on r19 (settlement repairs via non-empty ordered) but fatal on 17/18 (ordered=[] → no repair → all tabindex=-1 → MB-DOM-01).
- Failure mapping: ordered=[] → `onItemKeyDown` currentIndex=-1 (all KEY + RTL focus-move dead); registry `getNode()` null → `orderedEnabledValues()`=[] → `requestAdjacent` no-op (switching dead: KEY-03/05/06, FOCUS-01); ghost claim + empty ordered → all -1 (DOM-01, FOCUS tab-entry).
- Precedent: Menu.tsx:934 documents this exact class ("RovingFocus.Item drops child refs on React 17/18 (props.ref stripping), so the layout resolution below is the portable path"); Menu majors stay green because its Item children are forwardRef `Div`s (verified: primitives build uses `forwardRef`). Menubar root `Div` also forwards — ONLY the Popover.Trigger hop is broken.
- FIX (in-box): additive `getNode?: () => HTMLElement | null` seam on `RovingFocusItem` + `resolveEntryNode` fallback at all 9 `entry.ref.current` reads; MenubarTrigger resolves its button by stable id in a layout effect (MenuTrigger precedent) and passes `getNode`. Wide re-proof required (shared code).

## T+50 — fix implemented (2 files, both owned)
- `RovingFocus/RovingFocus.tsx`: `RovingFocusItemProps.getNode?` + `ItemEntry.getNode?` + `resolveEntryNode(entry)` (`entry.ref.current ?? entry.getNode?.() ?? null`); all 9 kernel node reads routed through it (grep-verified: only remaining `ref.current` is inside the helper); `getNode` added to `ITEM_EXCLUDED_PROPS` (never spreads to DOM) + register effect deps. Ref-first = zero behavior change for existing consumers (Menu/Tabs/Listbox pass no `getNode`).
- `Menubar/Menubar.tsx` (`MenubarTrigger` only): stable `triggerId` (`authoredId ?? menubar-trigger-<useId>`, MenubarMenu pattern); always rendered as button `id`; `useLayoutEffect` resolves `nodeRef` by id in the bar root's owning scope (document-or-ShadowRoot, MenuTrigger precedent; only-if-found so a 19 live ref is never nulled); `getItemNode` callback passed to `<RovingFocus.Item getNode>`. Registry `getNode` reads the same `nodeRef` → fixed automatically.
- Temp diag spec `ZZDiag.ct.spec.ts` + RovingFocus `[REDMB]` instrumentation: used, then DELETED/REVERTED (grep-verified 0 `REDMB`).
- No legacy props, no runtime fallback, no test touched.

## T+75 — gates (all green, quoted)
- Menubar majors ×2: `E2E: 46 | Passed: 46 | Failed: 0` / `react17: 23 passed | 0 failed` / `react18: 23 passed | 0 failed` → /tmp/red-mb-majors-fixed-1.txt, /tmp/red-mb-majors-fixed-2.txt
- Menubar r19 full: `E2E: 23 | Passed: 23 | Failed: 0` + `Unit: passed | 20 tests` → /tmp/red-mb-r19-full.txt
- RovingFocus r19: `E2E: 44 | Passed: 44 | Failed: 0` + `Unit: passed | 50 tests` → /tmp/red-mb-rf-r19.txt
- RovingFocus majors: `react17: 44 passed | 0 failed` / `react18: 44 passed | 0 failed` → /tmp/red-mb-rf-majors.txt
- Menu r19: `E2E: 91 | Passed: 91 | Failed: 0` + `Unit: passed | 43 tests` → /tmp/red-mb-menu-r19.txt
- Menu majors: `react17: 91 passed | 0 failed` / `react18: 91 passed | 0 failed` → /tmp/red-mb-menu-majors.txt
- FF/WK spot legs (FINISH-02 vehicle, --ignore-snapshots; were 14/23 per FINISH-02): r17FF `23 passed (0 failed)`, r17WK `23 passed (0 failed)`, r18FF `23 passed (0 failed)`, r18WK `23 passed (0 failed)` → /tmp/red-mb-17-ff.txt, /tmp/red-mb-17-wk.txt, /tmp/red-mb-18-ff.txt, /tmp/red-mb-18-wk.txt
- Typecheck: 0 errors in Menubar/ + RovingFocus/; 16 pre-existing errors elsewhere (NumberField 11, Slot 2, Accordion test 1, playwright/ct.ts 2) — untouched files, out of scope, NOT absorbed.
- Zero contention transients observed (sibling crew active; all runs deterministic).
- Per-finding disposition: all 18 owned reds (MB-DOM-01, MB-KEY-02/03/04/05/06/09, MB-FOCUS-01, MB-RTL-01 × r17+r18) FIXED by the single root-cause fix — verified green in majors ×2 + all 4 FF/WK legs. Zero holds.

## Resume checklist / close
- [x] Root cause proven with traces (console warning + fiber probes + render timeline), not guessed
- [x] Fix in owned files only (`git status`: 2 modified + this log; no other components touched; nothing committed)
- [x] Menubar majors 46/46 two-in-a-row; r19 23/23 + unit 20
- [x] Wide re-proof: RovingFocus + Menu r19 fulls + unit + majors legs, all green
- [x] FF/WK spot legs 23/23 ×4 (FINISH-02 vehicle)
- [x] Temp diag spec deleted; instrumentation reverted; raw logs in /tmp/red-mb-*.txt
- [x] Nothing committed (captain verifies firsthand + runs FINISH-06, commits per-arc)
