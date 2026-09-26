# features-DateField — DateField FEATURES crew log
START #1 required explicit locale (throw-for-all; in-dir migration only, cross-dir flagged)
LAND #1 code+unit (locale required + throw; story/book migrated to en-US; DF-FMT-06 unit written)
START #3 Constraint API (throw validation + isDateUnavailable + Calendar min/max + select-gate + managed invalid)
LAND #3 code+tests (assertValidDateBounds; isDateUnavailable; min/max to Calendar; select-gate; managed invalid; DF-BND-04/DF-BND-02 unit+CT; select-gate CT)
START #4 click-to-open vs caret (b; probe-first: CT written, behavior TBD by run)
LAND #5 docs-only (a) — DateField.md label-less policy; placeholder-as-name declined, no code change
BEFORE test run: pnpm agentct DateField --unit (first proof attempt)
AFTER: unit GREEN 28/28 (25 parse + 3 component: DF-FMT-06, DF-BND-04, BND-02-logic). NOTE first attempt flaked with transient daemon "Cannot find package '@reference-ui/react'"; direct vitest + retry green.
BEFORE test run: pnpm agentct DateField --e2e (probe #4 caret + #3 CT + snapshots)
AFTER run1: 13/20 — 7 infra FAILS (Vite "Failed to fetch dynamically imported module" for DateField.story.tsx, single timestamp; gallery serves 200 on probe; loaded daemon). #3 select-gate PASSED in run1.
AFTER run2: e2e GREEN 20/20 react19 (incl DF-BND-02 CT, #3 select-gate, #4b caret). Zero snapshot drift (all snap() asserts passed, no re-pin).
LAND #4 (b) as proof-pinned current behavior — probe PASSED unmodified: first click opens, click-while-open positions caret, no toggle. No code change needed; CT pins it.
FIX tsc: assertValidDateBounds takes unknown; CanonicalISODate casts at Calendar-string boundary; DateField tsc-clean (4 cross-dir locale errors flagged: Field.story 225+301, Icon.book 207, Showcase.book 502)
SPEC updated (FEATURES note; 17/64; DF-FMT-06/DF-BND-04/DF-BND-02 [x])
BEFORE test run: pnpm agentct DateField (full final; code changed since green)
UX review: nested subagent spawned (ux-designer method)
AFTER final run: FULL GREEN — unit 28/28 + e2e 20/20 react19 (snapshots unmodified, zero drift)
UX VERDICT: Look PASS (captures match chrome; snapshots untouched); Feel 7/7 approved; A11y good + F1 minor fail-forward note (silent rejections — recommend follow-up disabled styling/announcement; not a blocker). NOTE reviewer mis-stated Calendar min/max as live-disabled (they are dead props until Calendar #6); verdict unchanged.
DONE: #1 #3 #4 #5 landed; HOLD #2 untouched; typed-path gating (DF-BND-01/03-typed) verify-blocked on PATCHES #1 engine (visual-held); cross-dir locale migration flagged (Field.story 225+301 BREAK Field CT until migrated; Icon.book 207, Showcase.book 502 Book-only).

Mission: quarantine-landing FEATURES; branch: reference-system (no switch, no commit).
Scope: IMPLEMENT-NOW #1 (required locale, throw-for-all), #3 (Constraint API, throw),
  #4 (click-to-open vs caret, decided b), #5 (label-less name, docs-only a). HOLD #2 untouched.
Guardrails: API-STANCE breaking NOW no shims; visuals frozen (snapshot change needs
  view-story + UX sign-off else STOP); prove with `pnpm agentct DateField`; nested
  ux-designer review of delta; touch ONLY DateField dir + this log.

- [ ] #1 required explicit locale (throw-for-all)
- [ ] #3 Constraint API (min>max/non-canonical THROW; PATCHES #4 unblock)
- [ ] #4 click-to-open vs caret (b: first opens, click-while-open positions caret)
- [ ] #5 label-less accessible name (docs-only a)
- [ ] agentct DateField unit+e2e green
- [ ] ux-designer review of delta
