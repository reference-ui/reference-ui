# RED-TEAM STAGE 4 (Fortify) — Menubar Hunt 1

Date: 2026-09-27. Branch: `reference-system` (never switched; no commits —
captain commits). Ruling: `.agents/missions/red-team/menubar-rule.md` (BREAK:
stale pendingMenuEntry intent leaks across menus). Hunt: `menubar.md` Hunt 1.

## Fix (ruling path (a) only — plant site)

`packages/reference-lib/src/components/Menu/Menu.tsx` —
`useMenuTriggerKeys().onKeyDown` now records entry intent ONLY when the press
will actually open (`!isOpen` from `useOverlay()`). A press on an
already-open trigger plants nothing. Deliberately unchanged: the four plant
keys, `preventDefault` on all four, the unconditional
`overlay.setIsOpen(true)` request (open-state/dedup paths are untouchable per
the ruling and behave exactly as before), and the pointer `onClick` clear.
`isOpen` (boolean) joins the `useCallback` deps alongside `overlay`, so the
closure refreshes on every open-state change regardless of overlay object
identity — no stale closure from either side.

No consume-site change: (a) proved sufficient (all probes + pins green), so
(b) was not needed. No justification for (b) owed beyond this sentence.

Docs pin (`Menu.md:135-137`): "Intent is recorded only by a press that
opens — a press on an already-open trigger plants nothing."

Untouched per ruling: Overlay/Popover open-state, Menubar switch paths,
`requestValue` dedup, RovingFocus, menubar-nav, Esc/dismiss, pointer focus,
all Hunt-1 floor items. (Working-tree Listbox/Tabs edits belong to other
crews; not mine, not touched.)

## Files changed (mine)

- `packages/reference-lib/src/components/Menu/Menu.tsx` (+7/−3)
- `packages/reference-lib/src/components/Menu/Menu.md` (+1 sentence)
- `packages/reference-lib/src/components/Menu/Menu.test.tsx` (P4 pin, +1 `it`)
- `packages/reference-lib/src/components/Menubar/Menubar.test.tsx` (P1/P2/P3
  pins, +3 `it`s; harness gained optional `control` prop, additive only)

No weakened tests; no golden updates.

## Pins — fail-without-fix / pass-with-fix (firsthand, incl. stash cycle)

Pre-fix run (pins added, source untouched): P1/P2/P3 fail — switch lands on
`#mb-pin-edit-redo` (last) in all three; P4 fails — programmatic reopen lands
on `#pin-item-2` (last). Genuine-open legs inside P4 (Down→first, Up→last)
pass pre- and post-fix, pinning the must-keep behavior.

Stash cycle: `git stash push -- <Menu.tsx>` → pins re-run: 3 failed
(Menubar) + 1 failed (Menu); `git stash pop` → fix restored, pins re-run:
3 passed + 1 passed.

## Verification

- `pnpm --dir packages/reference-lib sync` first: green.
- `pnpm agentct Menu`: Unit passed (43 tests) + E2E 60 passed / 0 failed
  (React 19).
- `pnpm agentct Menubar`: Unit passed (20 tests) + E2E 23 passed / 0 failed
  (React 19).
- Blind repro unmodified (`pnpm agent vt -c
  /tmp/menubar-red/vitest.red.config.ts`, files untouched): 3/3 passed.
