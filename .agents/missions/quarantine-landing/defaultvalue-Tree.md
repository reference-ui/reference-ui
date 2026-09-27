# Tree controlled-only crew log — defaultValue deletion

Mission: Tree controlled-only (reference-system branch, no commits).
HQ stance: `docs/MISSIONS/API-STANCE.md` — value + onChange required everywhere;
defaultValue deleted catalog-wide; sibling uncontrolled props (defaultExpanded etc.) AWAIT HQ call.

## Checkpoint plan
1. [x] Recon: Tree.tsx, story, book, unit + CT specs, consumers, precedent, snapshots, docs
2. [x] Tree.tsx: delete defaultValue + internalValue + isControlledValue fork; value/onChange required (type + runtime throw, NumberField style)
3. [x] Tree.story.tsx Parity: migrate empty/omitted/reorder/det/refs trees to useState-controlled; DELETE noop section
4. [x] Tree.book.tsx CollapsedByDefault: useState-controlled
5. [x] Tree.test.tsx: TR-ENV-01 add onChange; add fail-fast unit tests TR-API-01/TR-API-02
6. [x] Tree.ct.spec.ts TR-DOM-10 rewrite (controlled contract; drop frozen-noop half)
7. [x] Consumers: Showcase.book.tsx DataLayoutRow; Combobox.story.tsx x2; Combobox.test.tsx x2
8. [x] Docs scrub: SPEC.md, DECISIONS.md (candidate 4 reversal), Tree.md API + L70 (TESTS.md freeze sections left as historical spec — no defaultValue mention)
9. [x] Verify: pnpm agentct Tree — unit 5/5; e2e 53/53 react19 (run 3, exit 0); snapshots unmodified + green
10. [x] UX review: nested ux-designer verdict PASS (detail truncated in transit — feel/a11y supplemented by method self-review, flagged)

## Test evidence
- Unit: `pnpm agentct Tree --unit` → 5/5 (TR-EXPAND-06, TR-ENV-01, TR-ENV-02, new TR-API-01 fail-fast value, TR-API-02 fail-fast onChange).
- E2E run 1: 42/53 (11 KEY/EXPAND/TYPE timeouts); run 2: 44/53 (9 timeouts); run 3: 53/53 exit 0. Identical code across runs; TR-KEY-03 passed alone in 463ms mid-incident; Tabs crew running concurrently on shared daemon → contention flake, not the change. Full log: /tmp/tree-e2e-run3.log.
- Snapshots: 15 baselines unmodified (git clean), zero drift failures.
- Artifact viewed: TR-DOM-10 test-finished screenshot — omitted branch expanded + selected, child visible, noop section gone.

## UX verdict (nested ux-designer: PASS, no rework)
- Look PASS (reviewer): Tree.tsx diff is prop plumbing only — zero JSX/style/className/DOM edits.
- Feel (method self-review, flagged): controlled selection mechanics unchanged; deleted uncontrolled + frozen-noop paths are the HQ-ordered brief; rejection-by-parent preserved (TR-SELECT-04/TR-EXPAND-03 green); keys/roving/typeahead untouched + green.
- A11y (method self-review, flagged): no ARIA/focus edits; TR-A11Y-01 green; fail-fast throws are descriptive render-phase errors.

## Flags for HQ / parent
- onChange made REQUIRED (type + runtime throw) per task order — goes further than landed Tabs/Splitter/NumberField/Calendar precedent (onChange optional there).
- library-catalog.ts Tree entry still documents defaultValue + optional value/onChange — not a TSX call site, out of touch scope, left stale.
- Video webm viewing unavailable in this crew's toolset (binary); judged from screenshots + logs + diff.

## Scope decisions (recorded, not asked — per brief autonomy)
- defaultExpanded/expanded UNTOUCHED: task names only defaultValue; stance says siblings await HQ call.
- onChange REQUIRED at type + runtime (throw when undefined): task says "onChange REQUIRED (no silent-frozen controlled)".
  Landed Tabs/Splitter/NumberField/Calendar keep onChange optional — this crew goes further per explicit task order. FLAGGED for HQ awareness.
- Snapshots: Basic + MultiLevel only, both already fully controlled → zero visual risk. Parity has no snapshots → section restructure safe.
- library-catalog.ts (MCP): stale defaultValue entry + optional flags. NOT a TSX call site → out of touch scope; FLAGGED, not edited.
- docs/ARCHIVE/MCP_RESTRUCTURE.md: frozen archive list mention → untouched.

## Progress
- Recon done. Consumer inventory (call sites to migrate):
  1. Tree.story.tsx: empty-tree, omitted-tree, noop-tree (delete), reorder-tree, det-tree, refs-tree
  2. Tree.book.tsx: CollapsedByDefault (defaultValue="item-a")
  3. Tree.test.tsx: TR-ENV-01 (value without onChange)
  4. Showcase.book.tsx: DataLayoutRow (defaultValue="file-1" + defaultExpanded)
  5. Combobox.story.tsx: TreePopupLog tp-tree, TreeTriggerLog bare Tree
  6. Combobox.test.tsx: L2299 (onChange without value), L2358 (bare Tree)
  7. Combobox.tsx: re-export only — no change.
