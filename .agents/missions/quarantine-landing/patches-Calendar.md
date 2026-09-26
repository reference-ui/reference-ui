# Calendar PATCHES crew log

IN PROGRESS — implementing packages/reference-lib/src/components/Calendar/PATCHES.md exactly.

## Triage (from PATCHES.md + code read)

- Item 1 (SSR/StrictMode/React-matrix suites CA-DAY-13/14, CA-ENV-01/03/04): BLOCKED, verified — no Weekdays/Days/Day parts, no custom renderer, no today marker in code (grep clean for `data-today|CalendarDay|renderDay|preview`); blockers are FEATURES #5 (DEFERRED) + #8 (DEFERRED). NOT LANDED, no invented work.
- Item 2 (initial tab target, CA-STATE-03): LANDED. `CalendarGrid` now computes `tabTarget` = selected in-month date, else today when rendered, else first in-month day; `tabIndex={cell.dateStr === tabTarget ? 0 : -1}`. Effective today via internal context field (valid `today` prop, else current UTC date — same default as pane seed). No public API change; zero style/JSX-paint lines touched. Partial-block note: CA-STATE-03's disabled-days preference sub-case needs per-day disable (FEATURES #6, DEFERRED; `min`/`max` still dead per SPEC) — unpinnable, flagged.
- Item 3 (CA-A11Y-01 checker sweep): BLOCKED, verified — weekday headers hardcoded `Su Mo…` (FEATURES #3 DEFERRED), padded cells are empty `<Td/>` not enabled days (#4 DEFERRED), no per-day disabled (#6 DEFERRED), no range preview (#9 DEFERRED). NOT LANDED, no invented work.

## Proof

- `pnpm agentct Calendar`: unit 20/20 (was 19; +1 CA-STATE-03 adapted renderToString pin) + e2e 7/7 react19 (was 4; +3 CA-STATE-03 behavioral, no-snap) GREEN; all 7 frozen snapshots passed unmodified.
- CT end-state screenshots inspected: Tab from header-next lands on 15 (today, Dec 2026 pane) and on 1 (first-of-month, Feb 2024 pane), focus ring visible, zero paint drift.
- Nested ux-designer review (dedicated child, artifacts judged): APPROVE. Look PASS (frozen — tabIndex-only delta, all day-Button paint props byte-identical, both screenshots show unchanged chrome). Feel: selection-less Tab-entry approved; no focus steal. No new a11y findings (pre-existing grid keyboard-nav gap stays with FEATURES #7).

COMPLETE — item 2 landed + proved; items 1 and 3 verified-blocked, untouched. Never left reference-system; never committed. Files: Calendar.tsx, Calendar.contract.test.tsx, Calendar.story.tsx, __e2e__/Calendar.ct.spec.ts + this log.
