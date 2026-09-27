# wants-calendar crew log

Status: COMPLETE (2026-09-27)
Scope: packages/reference-lib/src/components/Calendar only. Branch: reference-system (no switch, no commit).

## Verdicts
- W-20 custom day rendering — DONE. `Day` render prop `(date, {selected,inRange.disabled.today}) => ReactNode` on `Calendar`; replaces only button content (selection/disabled/keyboard untouched); nullish keeps default locale number; non-function fails closed.
- W-21 isDateUnavailable / firstDayOfWeek — DONE. Unavailable split from out-of-bounds into exact RAC semantics (focusable: roving tabindex + all movement keys land; unselectable: `aria-disabled`, greyed, `data-unavailable`, never emits). `firstDayOfWeek` already shipped as weekday-name strings with locale default (B-24 crew) — verified + covered in both override directions; no type change needed.

## Files changed (5, all in scope)
- Calendar.tsx — `Day` prop + `CalendarDayRenderState`/`CalendarDayRenderer` types, context `dayRender`/`isDateUnavailableDay`/`isDateUnselectable`, roving/keyboard narrowed to in-bounds (`nearestFocusable`/`skipToFocusable`), activation guards on merged unselectable, month/year/nav keep merged blocking, Day fail-closed validation.
- Calendar.story.tsx — `CustomDayCells` + `WeekStartOverride` fixtures, `con-toggle-bounds` on Constrained.
- Calendar.contract.test.tsx — reshaped CA-STATE-04/06, CA-STATE-03-disabled; added CA-STATE-07-adapted, firstDayOfWeek="sun", 2× W-20 Day tests.
- __e2e__/Calendar.ct.spec.ts — reshaped CA-STATE-04, CA-KEY-01/05, CA-KEY-02 (+bounds inward-skip pin), CA-DYNAMIC-02, CA-STATE-07; added W-20 + W-21 tests.
- TESTS.md — W-21 amendment notes on CA-STATE-04/05/06/07, CA-KEY-02/05/06, CA-DYNAMIC-02.

## Suites (React 19, styles synced first)
- Unit (Vitest): 67/67 passed (51 contract + 9 week-grid + 7 iso). Failed: 0.
- E2E (Playwright CT): 52/52 passed. Failed: 0.
- tsc: 0 errors in Calendar files. (Repo-wide tsc has pre-existing failures: `@reference-ui/icons` unbuilt + harness drift — outside scope, see flags.)
- Snapshots: all 7 settled-state snaps passed unchanged (no visual drift on default cells).

## Design notes (for HQ/captain)
- Day `disabled` flag = merged unselectable (out-of-bounds OR unavailable) — renderer-facing "grey" bit.
- Out-of-bounds paint wins where both apply (no `data-unavailable` alongside `data-disabled`).
- Nav-target + month/year disabling still count unavailable as blocking (a month with nothing selectable stays unreachable/unselectable) — CA-MONTH-04/CA-MODE-05 green unchanged.
- Playwright treats `aria-disabled` as non-actionable: silence clicks on unavailable days use `{ force: true }` (trusted click, established CA-MODE-05 pattern).

## Flags for HQ
1. `pnpm --dir packages/reference-lib typecheck` is red repo-wide for reasons outside this dir: `build:deps` fails (`TST-E-SCAN-FAILED` missing `packages/reference-icons/src/generated/view-apps.tsx`) and `tsc` reports pre-existing errors in `playwright/ct.ts`, `Accordion.test.tsx`, and `@reference-ui/icons` imports. Calendar itself is clean.
2. Shared `playwright/test-results/` is wiped by concurrent crews — artifacts cited were viewed before the wipe (W-20 dots/selected/unavailable-focus, W-21 Mon-first/Sun-first grids).
