# CORE-BOUND-05 — a real ref sync refuses a file nested 2,000 levels with a located ATM-E-PARSE inside 10 s, and syncs one nested 1,000 levels to exit 0 with both colours

The world is a consumer whose include reaches `src/`, and it has no sources of its own.
Each spec writes 70 small styled files and one deep file into a temp copy that it owns (`specs/deep-world.ts`), then syncs
the copy through the spawned bin under a 10 s kill budget.

`specs/nesting-2000.spec.ts` is the refusal side. A css value 2,000 parentheses deep is the shape that killed the sync with
SIGILL before the native containment, and the nesting gate now refuses it before Oxc parses it. The child must end with no
signal inside the budget and exit 1, and its output must name `ATM-E-PARSE`, the file at `src/deep.ts:3:1` and the whole refusal sentence, `nesting deeper than 1024 levels at line 3; split or flatten the deeply nested expression`.

`specs/nesting-1000.spec.ts` is the sync side. A css value 1,000 parentheses deep sits just inside the gate, so Oxc parses it.
The child must end with no signal and exit 0, and the published stylesheet must carry both colours: the blue comes from the
small files and the red from the deep value.

> Search terms: nesting, deep parentheses, nesting gate, ATM-E-PARSE, refusal, lane stack, SIGILL, sync budget, ref sync, native containment, CSS equality, temp world
