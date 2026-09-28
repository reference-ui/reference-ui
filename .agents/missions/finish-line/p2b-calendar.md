# Finish-line P2B — Calendar leg

Date: 2026-09-28. Repo root `/Users/ryn/Developer/reference-ui`.
Scope: `packages/reference-lib/src/components/Calendar/` only. No commits.

## Result

All four scope items landed and verified: `pnpm agentct Calendar` →
84 CT + 68 unit green on React 19 (52 + 67 pre-existing titles all
green, 7 frozen snapshots unmodified); `pnpm agentct Calendar --react
all -g "CA-DAY-14"` → green on 17/18/19. SPEC 78/132 → **111/132**.

New `[x]` (33): CA-DAY-01..14, CA-RANGE-01..16, CA-ENV-03, CA-ENV-04,
CA-KEY-09 (bonus, shares the CA-DAY-07 title). CA-VIEW-13 keeps its
`[x]` with the first fixture now proven too.

## What changed

- `Calendar.tsx` — `Calendar.Weekdays`/`Days`/`Day` parts; exact
  10-field `CalendarDayState`; per-date `DayCellModel` resolved once
  per grid render so Days (td) and Day (button) agree; CA-DAY-08..11
  diagnostics (deduped per distinct violation); range preview machine
  (hover wins, focus drives, validity = selectable candidate + clean
  span); Tab-commit (never prevented, Shift+Tab too); completion span
  guard (CA-RANGE-07, start retained); inclusive `aria-selected` /
  `data-in-range` + new `data-range-start/end` on day buttons (all
  paint-neutral); explicit `aria-selected` on tds (CA-STATE-09 form,
  buttons keep theirs for W-20); per-part defaulting at Calendar and
  Grid level (authored parts replace only their own default; Grid
  drops non-sections for table validity); preview hover tracked via
  mouseover/out + containment (React enter/leave breaks under shadow
  retargeting); hover cleared on grid rebuild (no stale Tab-commit).
- `Calendar.story.tsx` — DayPartsDefault, DayCustom
  (plain/decorated/conflict + vetoes + locale/month/value/unavail/
  events controls), DayViolations (8 renderer modes), RangeMachine
  (presets + accept/reject + order log + block12), RangeBounds,
  StrictDays, ShadowRange (portal), View13CustomDays.
- `__e2e__/Calendar.ct.spec.ts` — 32 new titles (DAY 12, RANGE 16,
  VIEW-13 first, DAY-14, ENV-03, ENV-04). Day attribute locators are
  scoped `button[data-date][...]` (defaulted Months/Years cells share
  range/data attrs).
- `Calendar.contract.test.tsx` — CA-DAY-13 (SSR byte-equality +
  hydration: no warnings/callbacks, ref-to-server-node identity).
- `SPEC.md` — P2B status block, index, 111/132, honest-scope notes.

## HQ flags

1. (a)(b)(c) proceeded: Tab-commit, exactness diagnostic, per-part
   defaulting. (d): `DateRangeValue` already `{start, end: ISODate |
   null}`; validation also tolerates absent `end` — no change needed.
2. Frozen-visuals split (deliberate): render-state `selected` /
   `aria-selected` / `data-in-range` are range-inclusive per
   CA-DAY-03/CA-RANGE-04, but `data-selected` + button/td paint stay
   endpoint/interior-only so the 7 baselines pass unmodified.
3. `aria-selected` lives on BOTH td (CA-DAY-06/CA-STATE-09 form) and
   button (W-20 compat — moving it breaks a pre-existing green title).
4. Preview is anchor-oriented (start keeps range-start, candidate
   takes range-end); completion normalizes to chronological.
5. No `matrix/` dir exists — SPEC's `matrix/...` paths are stale;
   colocated suites ARE the PATCHES.md #1 port.
6. Honest coverage: CA-DAY-07 + CA-ENV-04 chromium-only (no
   Firefox/WebKit CT project); CA-RANGE-11 synthetic tap path (no
   touch context); shadow proof on React 19 (portal events rely on
   React 19 composedPath dispatch); DAY-14 literally 17/18/19.

## Verify

- `pnpm agentct Calendar` (84 CT + 68 unit, React 19)
- `pnpm agentct Calendar --react all -g "CA-DAY-14"` (17/18/19)
- `tsc --noEmit -p packages/reference-lib` shows no Calendar errors
  (pre-existing errors elsewhere untouched).
