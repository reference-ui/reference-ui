# wants-tree crew — W-17: Tree APG `*` key

Status: COMPLETE (2026-09-27)

## Scope
- Dir: `packages/reference-lib/src/components/Tree` (+ colocated tests/stories) — ONLY.
- Branch: `reference-system`. No branch switches. No commits (captain commits).

## Spec (W-17, signed off)
- `*` on closed branch → expands it; focus stays.
- `*` on open branch → expands all (closed) siblings; focus stays.
- `*` on leaf → expands first closed sibling branch; focus stays.
- `*` never enters the typeahead buffer.
- RTL unaffected.

## Plan
1. `Tree.tsx`: `case '*'` in `handleItemKeyDown` + batch-expand helper
   (`getBatchExpanded`, single `onExpandedChange` emission).
2. Unit: `getBatchExpanded` determinism tests in `Tree.test.tsx`.
3. E2E: TR-KEY-12 (three cases + RTL), TR-KEY-13 (`*` excluded from typeahead).
4. `pnpm --dir packages/reference-lib sync`, then `pnpm agentct Tree` (unit + e2e, React 19).

## Result
- DONE. Branch `reference-system`, no commits.
- Files: `Tree/Tree.tsx` (`case '*'` + `getBatchExpanded`/`expandItems`;
  `toggleExpanded` refactored onto shared `getOrderedBranches`, no behavior
  change), `Tree/Tree.test.tsx` (+2 unit), `Tree/__e2e__/Tree.ct.spec.ts`
  (+TR-KEY-12, +TR-KEY-13), `Tree/TESTS.md` (catalog rows).
- Suites: unit 7/7 pass; e2e 55/55 pass, 0 failed (React 19, incl. all
  pre-existing snaps — no visual drift); typecheck clean for Tree files.
- Judgment calls: disabled sibling branches are skipped by `*` (TR-EXPAND-09);
  no-op `*` emits no `onExpandedChange`.
- Flag for HQ: package typecheck currently fails on other crews' files
  (Calendar `skipToEnabled` + context props, NumberField `data-pressed`,
  Slot test `id`) — untouched, out of scope.
