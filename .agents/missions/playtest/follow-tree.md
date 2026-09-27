# Tree follow-up crew log (H-2)

Status: **COMPLETE** (branch `reference-system`, no commits — captain commits)

Scope: `packages/reference-lib/src/components/Tree` only + this log.

Item: packaging crew smoke gate H-2 (`packaging.md`): `Tree.tsx:337`
(`:321` at packaging time — file shifted) renders
`outlineColor: 'var(--colors-ui-focus-ring, {colors.ui.focus.ring})'` — a
literal `{colors…}` theme-layer template placeholder ships verbatim into
the CSS fallback slot (confirmed in emitted sheet
`.reference-ui/styled/styles.css:3485`).

Fix: `outlineColor: 'ui.focus.ring'` — the component-level token ref used
by the Tree leaf branch itself (`Tree.tsx:416` via `_focusVisible`) and
siblings (Tabs, Calendar, Listbox, Splitter, `shared.ts`). Emitted sheet
proves it resolves: `_focusVisible` rule at `styles.css:3458` emits clean
`outline-color: var(--colors-ui-focus-ring)`; `--colors-ui-focus-ring` is
defined on `:root` (lines 678/831). No new token invented.

Test: new CT gate pinning the emitted branch-focus rule contains no
`{...}` placeholder (non-vacuous: asserts the rule exists AND is clean).

## Verification

- `pnpm --dir packages/reference-lib sync` + rule check in emitted CSS
- `pnpm agentct Tree --unit`
- `pnpm agentct Tree --e2e` (React 19)

## Completion verdict

**H-2 — FIXED.** One-line token fix + non-vacuous CT pin + catalog entry.
No new token invented; branch now matches the leaf branch of the same file
and all sibling components.

Files changed (Tree scope only):

- `packages/reference-lib/src/components/Tree/Tree.tsx:337` —
  `outlineColor: 'var(--colors-ui-focus-ring, {colors.ui.focus.ring})'` →
  `outlineColor: 'ui.focus.ring'`
- `packages/reference-lib/src/components/Tree/__e2e__/Tree.ct.spec.ts` —
  new `TR-CSS-01` gate (injected-sheet scan: branch focus rule exists,
  declares `outline-color`, contains no `{...}` placeholder)
- `packages/reference-lib/src/components/Tree/TESTS.md` — `TR-CSS-01`
  catalog entry under Required cases

## Verification (suites with Failed counts)

- `pnpm --dir packages/reference-lib sync`: clean (255.9 KB, 10 warnings —
  pre-existing count, unchanged by this fix). Emitted rule now
  `outline-color: var(--colors-ui-focus-ring)` in both `styled` and `react`
  sheets (`:3485`); `grep -c '{colors'` over the styled sheet = **0**
  (was 1 pre-fix). **Failed: 0.**
- `pnpm agentct Tree --unit`: 7/7 passed. **Failed: 0.**
- `pnpm agentct Tree --e2e` (React 19): 56/56 passed, incl. new TR-CSS-01.
  **Failed: 0.** No snapshot drift (fix changes an invalid fallback that
  never evaluated — the primary `--colors-ui-focus-ring` var was always
  defined — so paint is byte-identical; no baseline update needed or taken).
- Negative control: fix temporarily reverted + re-synced (placeholder back
  in sheet, count 1) → `TR-CSS-01` **FAILS** as designed; fix restored +
  re-synced (count 0) → `TR-CSS-01` passes. The pin is real, not vacuous.

## Flags for HQ

1. Harmless-in-practice today: the shipped placeholder sat in a `var()`
   fallback slot whose primary (`--colors-ui-focus-ring`, defined on
   `:root`) always resolves, so no user-visible breakage — but any theme
   without that var would have produced an invalid declaration. Fixed at
   the root regardless.
2. No other `{...}` leaks in component sources: `grep` shows the
   `{colors.…}` placeholder syntax now appears only in theme-layer files
   (`src/core/theme/**`), where the token resolver legitimately consumes
   it. Worth a lint rule so component-level `css()` values can never
   reintroduce it.
3. Other modified files in the working tree (Listbox, Splitter, Tabs, docs)
   belong to parallel crews — untouched by this crew; captain coordinates
   the commit.
