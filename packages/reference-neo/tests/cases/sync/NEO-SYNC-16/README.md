# NEO-SYNC-16 — `logs: ['compiler']` threads the opt-in through sync into the warning summary and the verbose compiler list

Evidence: `[atm]` ATM-DIAG-07 (channel isolation), sibling NEO-SYNC-11 (node-side sync driver).

This case opts OUT of the runner sync hook (`"sync": false`): the spec drives
`sync()` itself under a `console.warn` spy, like NEO-SYNC-11. The world
carries `logs: ['compiler']` in `ui.config.ts` plus dynamic, spread, and
dead-branch content in `theme/dynamic.ts`, so the engine returns
`compilerDiagnostics` and sync counts them in the one-line warning summary
by default, while `--verbose` lists them behind the compiler tag carrying
the stable channel codes (`ATM-W-DYNAMIC-*`, `ATM-W-UNFOLDABLE-SPREAD`,
`ATM-I-HARVEST-SINK`) and userspace lines stay free of channel-family
codes (ATM-DIAG-07's predicate). The spec pins three halves: (i) config
threading — `compile-request.json` carries `logs: ['compiler']`; (ii)
default summary — exactly one call, the counted line, no codes; verbose —
one call whose compiler-tagged lines carry the stable codes; (iii)
isolation — no channel code in userspace lines, and a no-logs copy of
the same world prints no compiler output at all.

> Search terms: compiler-backchannel, logs-compiler, printer, channel-isolation, opt-in, sync/compiler, ATM-DIAG-07, NEO-SYNC-11
