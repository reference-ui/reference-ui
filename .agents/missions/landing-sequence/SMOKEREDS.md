# SMOKEREDS — objective log

IN PROGRESS

Scope: the 3 foreign consumer-smoke reds (reproduced firsthand by
captain, NOT 4a-caused): (1) zero-unexpected-console-errors — Tabs
renders Tab/Panel parts with no Tabs.List diagnostic; (2)
zero-b03-noise — 1 element.ref error (B-03, presence); (3)
zero-race-style-warnings — 10 dev-race warnings (H-6 class,
timing-flaky?). Diagnose each (baseline: they reproduce on the
landed tree; fix-or-scope per finding; flake → prove with repeats
+ quarantine-or-tolerance per house rules, never silent skip).
Repro: `pnpm --dir packages/reference-lib run smoke` (captain log
/tmp/smoke-4a.txt). Gate: full smoke exit 0. Box: 45 min. No API
shape changes. Crew writes below.
