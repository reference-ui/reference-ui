# NEO-SYNC-16 — `logs: ['compiler']` threads the opt-in through sync and prints one collapsed `[neo] compiler` call

Evidence: `[atm]` ATM-DIAG-07 (channel isolation), sibling NEO-SYNC-11 (node-side sync driver).

This case opts OUT of the runner sync hook (`"sync": false`): the spec drives
`sync()` itself under a `console.warn` spy, like NEO-SYNC-11. The world
carries `logs: ['compiler']` in `ui.config.ts` plus dynamic, spread, and
dead-branch content in `theme/dynamic.ts`, so the engine returns
`compilerDiagnostics` and sync prints them as one `[neo] compiler` call
carrying the stable channel codes (`ATM-W-DYNAMIC-*`,
`ATM-W-UNFOLDABLE-SPREAD`, `ATM-I-HARVEST-SINK`) while userspace
`[neo] sync warning` output stays free of channel-family codes
(ATM-DIAG-07's predicate). The spec pins three halves: (i) config threading
— `compile-request.json` carries `logs: ['compiler']` and the channel
printed; (ii) distinct printer — exactly one compiler call with stable
codes; (iii) isolation — no channel code in userspace output, and a no-logs
copy of the same world prints no `[neo] compiler` output at all.

> Search terms: compiler-backchannel, logs-compiler, printer, channel-isolation, opt-in, sync/compiler, ATM-DIAG-07, NEO-SYNC-11
