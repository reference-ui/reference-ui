# Tabs uncontrolled restoration — crew log

HQ directive: Tabs KEEPS uncontrolled support (exception alongside Accordion).
Current state: `value` required, `defaultValue` deleted, omitted-value throw.
Target: dual-mode per Accordion shape (`isControlled` + `internalValue` precedent).

## Checkpoint plan

1. [x] Read test-component skill, ux-designer skill, API-STANCE.md
2. [x] Read Tabs.tsx (controlled), Tabs.test.tsx, Accordion dual-mode shape
3. [x] Read rest of Tabs.tsx (TabPanel tail, compound assignment, exports)
4. [x] Restore dual-mode in Tabs.tsx (defaultValue, optional value, internal state, setValue, remove throw)
5. [x] Update Tabs.test.tsx (drop omitted-throw test, add uncontrolled pins; keep controlled tests)
6. [x] Verify Showcase.book controlled consumer unaffected (read-only check)
7. [x] Run `pnpm agentct Tabs` (unit + e2e green, 22 snapshots byte-identical)
8. [x] Nested ux-designer review (spawn accepted; verdict below)
9. [x] Report

## Verification

- Unit: 34/34 green (30 kept − 1 purge throw-test + 5 uncontrolled pins:
  seed+self-manage+notify, omitted→nothing+repair+first-click, arrows
  self-select, null, controlled precedence).
- E2E (React 19): 10/10 green, 22/22 snapshots byte-identical, no
  actual/diff files produced. Stories + spec untouched (all controlled).
- UX (nested reviewer, read-only): Look PASS (selection-plumbing-only
  diff; snapshots eyeballed clean). Feel: all 5 behavior changes APPROVED
  (self-manage, click/keyboard funnel, onChange both modes, controlled
  precedence, contracted empty state). A11y: no new problem; empty state
  ARIA-honest. Notes: reviewer could not view CT videos (test-results
  dir since overwritten by Tree runs — substituted snapshots+diff+pins);
  keyboard-pin gap closed with the arrows self-select pin above.

## Progress

- Step 1-2 done. Accordion shape: `isControlled = valueProp !== undefined`,
  `useState` seeded by `defaultValue` (fallback `expansion === 'single' ? null : []`),
  `currentValue = isControlled ? valueProp : internalValue`,
  toggle writes internal only when uncontrolled, `onChange` fires in both modes.
- Tabs arc frozen items (do not relitigate): variant, root-disabled removed,
  keepMounted, rescue, handoff, stop policy, link recipe.
- Restoration: `value?`, `defaultValue?: string | null`,
  `useState(() => defaultValue ?? '')` (null/missing → '' = nothing selected;
  pre-purge e536413b1^ shape confirmed), `setValue` writes internal when
  uncontrolled, required-value throw deleted.
- Tests: purge throw-test replaced with 4 uncontrolled pins (seed+self-manage+
  notify, omitted→nothing+repair+first-click, null, controlled precedence).
  All other controlled tests untouched.
- Showcase.book.tsx uses controlled Tabs — unaffected, no migration.
- Docs (Tabs dir only): book comment, Tabs.md props+dual-mode line,
  FEATURES.md #1 reversal note, SPEC.md contract lines. DECISIONS.md left as
  historical record. Stories + e2e spec untouched (all controlled).

## Files changed

- packages/reference-lib/src/components/Tabs/Tabs.tsx (dual-mode)
- packages/reference-lib/src/components/Tabs/Tabs.test.tsx (pins)
- packages/reference-lib/src/components/Tabs/Tabs.book.tsx (comment)
- packages/reference-lib/src/components/Tabs/Tabs.md (props + dual-mode line)
- packages/reference-lib/src/components/Tabs/FEATURES.md (#1 reversal note)
- packages/reference-lib/src/components/Tabs/SPEC.md (contract lines)
- .agents/missions/quarantine-landing/tabs-uncontrolled.md (this log)
- No consumer migration: Showcase.book.tsx controlled usage unaffected.
  No branches switched, nothing committed.
