# Calendar tests

Playwright: `matrix/lib/tests/e2e/calendar.spec.ts`  
Page: `/calendar`  
Vitest later: grid construction / week-start tables if pure.

Public values are ISO `YYYY-MM-DD`, not `Date` / `CalendarDate`.

## Unique to Calendar

| Our case | Vendor |
| --- | --- |
| **Week does not start Sunday** (`locale="en-GB"` freeze gate) | `@internationalized/date` `startOfWeek` / `weekStartData.ts`; react-day-picker `weekStartsOn` |
| Padded month grid; outside-month cells `data-outside-month` | Aria calendar grid; DayPicker `getMonths` |
| 2D keyboard: day, week, Home/End, PageUp/PageDown month; skip unavailable / min/max | Aria `useCalendarGrid`; DayPicker `getNextFocus` |
| Today / selected / focused are distinct `data-*` | both |
| **Range:** `{ start, end }`; hover preview while start set is **not** `onChange` | Aria `anchorDate` / `highlightedRange`; DayPicker `onSelect({ from, to: undefined })` is the **wrong** app-state model — contrast |
| Previous/Next buttons; heading announces month change | DayPicker labels; Aria |
| Grid is `table`; days are `td` > `button` | our DOM |

## Triple composition

Single value, **range picker**, **non-Sunday week** (required freeze gates).

## Combined

DatePicker (input + Popover + Calendar) is a documented composition — parsing stays in app code. Do not build a DatePicker spec for Calendar freeze.

## Not here

Time-of-day. Typed-input parsing. Buddhist/Hijri packages. Third-party date objects.
