# FEATURES Calendar cluster A — contract crew log

Branch: reference-system (stay; never commit).

Scope (IMPLEMENT ONLY): #1 discriminated mode props + required value,
#2 fail-closed invalid props (BLANK: render null + one dev diagnostic),
#13 single-mode selection semantics (uniform-request),
#14 whole-calendar disabled (REMOVE),
#12 controlled-month machine (remount reseeds from value/today).
NOT in scope: #3/#4/#6/#7/#8/#11 (cluster B), HOLD #5/#9/#10.

## Plan
1. Read triage Calendar section + FEATURES.md + API-STANCE.md (done).
2. Read Calendar.tsx, index.ts, SPEC/DECISIONS/TESTS, contract test, story/book incrementally (log line between reads).
3. Grep in-repo Calendar consumers for #1 migration.
4. Implement #1, #2, #13, #14, #12 in Calendar dir only.
5. Read test-component skill; run pnpm agentct Calendar (unit+e2e green).
6. Nested ux-designer review of delta (or self-review + flag if pool-full).

## Checkpoint 1 (2026-09-26): triage + FEATURES + stance read; plan written; branch reference-system confirmed.
- Read Calendar.tsx (full)
- Read DECISIONS.md
- Read SPEC.md
- Read contract test
- Read index.ts + iso.ts
- Read TESTS.md head
- Read TESTS CA-ISO-06/07
- Read TESTS CA-STATE/CA-MONTH
- Read TESTS CA-SINGLE (note: triage uniform-request overrides CA-SINGLE-03 no-emit)
- Read TESTS CA-MODE
- Read story
- Read book
- Read CT spec
- Read PATCHES.md (no interaction with cluster A)
- Grep: in-repo <Calendar> consumers = DateField.tsx:126 (needs ?? null), DateField.tsx:394 (ok), DateField.book.tsx:35 (ok), Showcase.book.tsx:528 (ok); no matrix refs; no disabled passers
- Diagnostic convention: globalProcess + console.error dev-only (Combobox/Splitter/NumberField); removal precedent: Tabs clean-cut, no shims
- Checkpoint 2: design settled. #1 union on mode (day/range/month/year), value required, onChange mode-typed, defaultValue removed, DateRangeValue.start required. #2 single validate fn, dev diagnostic + null. #13 selectDate emits unconditionally (already does; pin + drop internal state). #14 delete disabled everywhere. #12 total month resolver + value-follow effect (uncontrolled) + boundary nav disable; min/max-availability nav disable left to cluster B (#6 seam).
- START #1 discriminated mode props + required value
- Read test-component skill
- LAND #1 discriminated mode props + required value (union on mode, DateRangeValue.start required, defaultValue removed; DateField.tsx:127 migrated ?? null; DateField.tsx:394, DateField.book.tsx:35, Showcase.book.tsx:528 compile as-is)
- LAND #2 fail-closed (validateCalendarProps + dev diagnostic + null; hooks kept total, early return after hooks)
- LAND #13 uniform-request (controlled-only selectDate, unconditional emit; contradicts old CA-SINGLE-03 no-emit read — triage wins, noted in CT)
- LAND #14 disabled removed (props/context/nav/grid/root; Tabs clean-cut precedent)
- LAND #12 controlled-month machine (controlled independent; total resolver; uncontrolled value-follow effect; remount reseed via initializer; boundary nav disable; min/max-availability nav disable left to cluster B #6 seam)
- Incidental: heading Date.UTC 1900-offset fix for years 1..99 (boundary panes surfaced it; same correction as grid kernels)
- BEFORE typecheck run 1 (tsc --noEmit, lib)
- AFTER typecheck: 0 errors in Calendar dir + DateField.tsx wrapper; 8 remaining errors all in other crews' files (Combobox/Icon.book/NumberField/Slot.test/ct.ts) — untouched
- BEFORE agentct Calendar --unit run 1
- AFTER agentct --unit run 1: 36/37 pass; 1 fail = grid year not zero-padded (data-date="1-01-01", CA-ISO-08 grid-generation clause) — fixed with formatISODate
- BEFORE agentct Calendar --unit run 2
- AFTER agentct --unit run 2: passed 37/37
- BEFORE agentct Calendar --e2e run 1
- AFTER agentct --e2e run 1: 11/11 pass react19 (7 pre-existing incl. 7 frozen snapshots green + 4 new); spot-checked 2 finished screenshots (April follow-value end state, Dec-9999 grid) — correct
- BEFORE agentct Calendar --e2e --react 18 run 1
- AFTER agentct --e2e --react 18 run 1: 11/11 pass (behavioral; snapshots 19-only, skipped)
- Doc coherence: SPEC.md gaps + case index, DECISIONS.md non-decision, TESTS.md CA-SINGLE-03 amendment updated
- UX REVIEW (nested ux-designer, live): LOOK pass (frozen, 7 snapshots byte-unmodified, live Book matches); FEEL all 7 changes approved (controlled value, fail-closed, uniform-request, disabled removal w/ migration note, month machine, boundary nav disable, year-1 canonical fixes); A11Y no findings (1 known cluster-B note: per-day disabled awaits #6). Verdict: SHIP IT. Artifacts: Book captures + frozen baselines + CT end-states.
- Checkpoint 3 (final): all 5 items landed, unit 37/37, e2e 11/11 (react19 + react18), typecheck clean for touched files, UX signed. Branch reference-system, no commit. Handoff to cluster B: #6 extends prevDisabled/nextDisabled with min/max/unavailable target-month coverage; #4 padded grid; #3 locale; #7 keys; #8 today marker; #11 heading/announcements.
