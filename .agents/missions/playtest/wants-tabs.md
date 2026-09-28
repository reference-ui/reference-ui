# wants-tabs crew log (W-15 + W-16)

Status: **COMPLETE**

Scope: `packages/reference-lib/src/components/Tabs` only. Branch: `reference-system` (never switch, never commit).

## Plan
- W-15: root `keepMounted?: boolean` (default false) on `Tabs`, threaded via
  context, OR-ed with the existing per-panel `keepMounted`. Inactive panels
  already render `hidden`; decision: `hidden` alone (native `display:none`
  removes from tab order + a11y tree — no `aria-hidden`/`inert` needed).
  Base UI parity: `Tabs.Root keepMounted` default `false`.
- W-16: dev-only `console.error` in `Tabs` when controlled `value` matches no
  registered tab AND ≥1 tab registered (async guard — empty registry never
  warns). Message: component + bad value + registered values. Convention:
  `globalProcess` guard + `Reference UI: Tabs …` prefix (matches the file's
  duplicate-value errors).
- Tests: colocated `Tabs.test.tsx` additions for both wants; CT case for
  root keepMounted if cheap.
- Verify: `pnpm --dir packages/reference-lib sync`, then
  `pnpm agentct Tabs --unit` + `--e2e` (React 19).

## Progress
- Read WANTS.md, PLAYTEST-REQUIREMENTS.md Part 2 (W-15/W-16), prior-art.md,
  Tabs.tsx, Tabs.test.tsx, Tabs.md.
- Panel-level `keepMounted` already exists (FEATURES #3 + unit proofs);
  W-15 adds the root-level switch.

## Result
- W-15 DONE: `keepMounted?: boolean` (default `false`) on `Tabs`, threaded
  via context, OR-ed with per-panel `keepMounted` in `TabPanel`. Inactive
  kept panels carry native `hidden` only — specified: `display:none`
  removes them from tab order + the a11y tree, so no `aria-hidden`/`inert`.
  Keyboard/ARIA untouched (roving scope, tab order pinned in tests).
- W-16 DONE: dev-only `console.error` —
  `Reference UI: Tabs value "setings" matches no Tab (registered values:
  general, settings, billing).` Fires only when controlled AND ≥1 tab
  registered (empty registry = async still resolving = silent).
  `globalProcess` prod guard, matching Splitter/Slider convention.
- Files: `Tabs/Tabs.tsx`, `Tabs/Tabs.test.tsx` (+8 tests), `Tabs/Tabs.md`,
  `Tabs/SPEC.md` (Done-when line), `Tabs/Tabs.story.tsx` (+`KeepMounted`
  story), `Tabs/__e2e__/Tabs.ct.spec.ts` (+1 W-15 test). No styles touched;
  `sync` run per skill (covered by watch session, no diff).
- Suites (React 19): unit 46 passed / 0 failed (43 Tabs.test + 3 MyTabs);
  e2e 12 passed / 0 failed. `tsc --noEmit`: zero Tabs errors (Accordion +
  Slot errors pre-existing, other crews' scope).
- Note: two pre-existing dynamic-removal unit tests now emit the W-16
  warning on stderr (controlled value left unmatched after removal) —
  intended behavior, tests still green.
- Flags for HQ: none. No branch switch, no commit (captain commits).
