# CORE-BOUND-05 — a real ref sync of 70 files and one file at 2,000 nesting exits 0 with no signal, inside 10 s, and its stylesheet has both colours

A css value 2,000 parentheses deep killed the sync with SIGILL before the native containment.
The world is a consumer whose include reaches `src/`, and it has no sources of its own.
The spec writes 70 small files and the deep file into a temp copy that it owns.
The copy is synced through the spawned bin under a 10 s kill budget.

The child must end with no signal and exit 0, and the published stylesheet must carry both colours.
The blue comes from the small files and the red from the deep value.

> Search terms: nesting, deep parentheses, lane stack, SIGILL, sync budget, ref sync, native containment, CSS equality, temp world
