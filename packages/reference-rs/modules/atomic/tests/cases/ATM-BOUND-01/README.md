# ATM-BOUND-01 — a lane-sized project with one 2,000-deep parenthesised value compiles

The input is 71 styling files, enough to shard across the parse lanes. `src/deep.ts` nests one `css()` colour value 2,000 parentheses deep. The compile runs in a child process through `runIsolated` (see `ISOLATED_CASES` in `harness/helpers.ts`), so it must finish with no signal inside the 5 s budget and emit the red class. Before the native containment, the deep value overflowed a thread stack and the process died with SIGILL.
