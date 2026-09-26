# Calendar patches (mechanical, test-pinnable)

Every item below is fully specified — a test could pin it today. No API
design needed; most are blocked only on FEATURES.md items landing first.

### 1. SSR / StrictMode / React-matrix suites (from DECISIONS candidate #13)

- **What:** Prove deterministic custom-Days hydration, single button identity + single event default under StrictMode on React 17/18/19, and identical behavior in ShadowRoot + 3 engines.
- **Acceptance:** `CA-DAY-13`, `CA-DAY-14`, `CA-ENV-01`, `CA-ENV-03`, `CA-ENV-04` green against the real API (blocked until Days parts + today marker land).
- **Source:** quarantine commit `b19c73bee`; TESTS.md `CA-DAY-13/14`, `CA-ENV-01/03/04`.

### 2. Initial tab target when the pane holds no selection (from DECISIONS gap #1)

- **What:** Deterministic initial tab target — selected date, else today, else first enabled in-month day — so a selection-less pane keeps exactly one tab stop.
- **Acceptance:** TESTS.md `CA-STATE-03` passes; pane with no selection exposes one day tab stop.
- **Source:** nested ux-designer review via crew log `.agents/missions/quarantine-landing/calendar.md:16`; current `Calendar.tsx:395`.

### 3. CA-A11Y-01 checker sweep (from DECISIONS gap #3)

- **What:** Run the configured accessibility checker after settling each named state across `en-GB`, RTL, padded days, constraints, and pending/complete ranges.
- **Acceptance:** TESTS.md:1205 `CA-A11Y-01` — zero violations plus one named grid, valid table ancestry, unique relationships, one day tab stop, correct current/selected/disabled semantics (blocked until locale, padded grid, disable, and preview land).
- **Source:** TESTS.md:1205 (no quarantine case ID); SPEC.md:90.
