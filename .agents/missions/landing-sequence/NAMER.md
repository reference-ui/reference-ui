# NAMER — objective log

IN PROGRESS

Scope: smoke `zero-race-style-warnings` — deterministic 10/10 namer
miss-collection (mislabeled "race"). Forensics in SMOKEREDS.md: warned
value `repeat(3,1fr)` rule provably lives INSIDE `@layer reference-ui
> utilities` post-hoc, yet reference-rs namer miss probe
(modules/atomic/js/namer/miss.ts) warns — constructed-class vs
collected-class match failure (collection/spelling, NOT timing).
Fix in reference-rs under agent-rs gates. Resume: instrument
`reportMissCandidates` with classNames in a scaffold copy; diff
constructed vs `scanSheets()`-collected set; fix miss.ts; full smoke
must show missRaceNoise=0 with zero-true-gap still PASS. Follow the
agent-rs skill (project skill id) — canonical `pnpm agentrs`
commands + quality gate on every touched file. Box: 60 min. No API
shape changes. Crew writes below.
