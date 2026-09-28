# P1.1 RovingFocus — DONE (finish-line crew report)

Kernel is production: **53/55 named cases proven** (was 7/55), React 17/18/19,
consumers green. No commits (captain commits).

## Done

- **Visual grid for `orientation="both"`** (FEATURES #1): new `grid.ts` —
  rows group by vertical overlap from per-keystroke rects, horizontal moves
  follow visual x order, vertical moves take the adjacent row's nearest
  center with DOM-order ties, disabled cells keep geometry but are never
  destinations, loop wraps inside geometry, RTL falls out of the layout,
  Home/End/PageUp/PageDown stay whole-composite. `RF-GRID-01`–`08` CT-proven.
- **Transparent slot contract** (FEATURES #2): Root/Item extend the
  documented `ReferenceSlotPartProps` shape (local alias, Listbox precedent),
  `forwardRef`, merge per components.md (child wins; className combined with
  `css()` compiled first; style shallow-merged; handlers child→part→kernel
  each gated on `defaultPrevented`; refs chained incl. the pre-19
  `element.ref` path Menu's workaround documents; `aria-describedby`
  concatenated; Item `tabIndex` kernel-authoritative). `RF-API-01`,
  `RF-DOM-01/02`, `RF-TAB-08` proven.
- **Currentness repair fix** (real bug found by `RF-TAB-06`): settlement is
  now a post-commit every-commit effect — catches `hidden`/native-disabled/
  `display:none` flips that bypass props, and resolves remove-repair
  next-then-previous against the last committed order (old code fell back to
  first item on remove). `RF-TAB-06/07` CT-proven.
- **Nesting**: `defaultPrevented` protocol already satisfied
  `RF-NEST-01/02` (inner consume stops outer kernel; unsupported keys bubble);
  CT-proven with a real nested fixture. No blanket `stopPropagation`
  (stays DECLINED per DECISIONS #7).
- **Space guard** (PATCHES #1): unchanged bubble-`preventDefault`, still
  green (`RF-TYPE-06` ×2).
- **Proof suite**: 10 new fixtures, 36 new CT tests, `grid.test.ts` (14),
  `types.test.ts` (`RF-API-01` incl. `@ts-expect-error` negatives),
  slot-merge unit pins. 5 new snapshot baselines (first-run writes, not
  updates); all 10 pre-existing baselines byte-identical.

## Remaining

- `RF-ENV-03` (Firefox/WebKit parity) — Chromium proven here; needs the
  matrix engine layer (`pnpm agent`), not CT. Only open case.
- FEATURES #7 consumer migration (Tabs/Listbox/Tree arrows onto the kernel)
  — owned by consumer crews; kernel API frozen, unblock fired.
- FEATURES #2 remainder: direct token props (e.g. `padding="4"`) on the
  parts forward to the child uncompiled until the shared Slot helper owns
  the split (documented in SPEC.md/RovingFocus.md; `css` prop compiles
  today, primitive children compile downstream).

## Suites + results (this session, final code state)

| Suite | Result |
|---|---|
| Unit (`agentct RovingFocus --unit`) | 50/50 |
| CT React 19 (`--e2e`) | 44/44 |
| CT React 17 + 18 (`--e2e --react 17,18`) | 44/44 each (behavioral, snaps skip off 19) |
| `tsc --noEmit` (RovingFocus files) | clean |
| Menu e2e (consumer) | 92/92 |
| Menubar e2e (consumer) | 23/23 |
| Artifact inspection | grid/nested/slot end-state screenshots correct; kernel has no motion |

Notes: one e2e run showed 9 failures (snap mismatches + click timeouts)
during heavy shared-daemon contention; immediate re-run green 44/44 —
churn, not code. Package-wide `tsc` still fails in sibling crews' in-flight
Splitter/Slider files (not mine, untouched). Test-only learnings: repeat
`mount()` is a root *update* (used `unmount()` between fresh-state phases);
`keyboard.type()` skips keydown for non-ASCII (Unicode pins use dispatched
keydowns); `Alt+X` combos dispatch 2 keydowns.

## Unblocks fired

- Tabs crew: kernel arrows + RTL + loop ready to compose (FEATURES #7).
- Listbox crew: `TypeaheadModel` + `shouldIgnoreTypeaheadKey` + grid ready.
- Tree crew: 1D + grid kernel ready.
- Menu/Menubar: already composing; verified green against this kernel.

## Files (all inside RovingFocus; no neighbor edits)

M `RovingFocus.tsx` (slot merge, grid path, settlement rework),
M `RovingFocus.story.tsx` (+10 fixtures), M `RovingFocus.test.tsx` (+5),
M `__e2e__/RovingFocus.ct.spec.ts` (+36), M `SPEC.md`, M `RovingFocus.md`;
new `grid.ts`, `grid.test.ts`, `types.test.tsx`, 5 snapshots.
