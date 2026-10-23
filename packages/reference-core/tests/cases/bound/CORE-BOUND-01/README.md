# CORE-BOUND-01 — a tokens() tree that contains itself fails ref sync with exit 1 and 'token tree cycles at colors.self (<file>)'

A fragment file evaluates to live objects, so a `tokens()` call can hand sync a tree that holds itself: the world's
`colors` group sets `colors.self = colors`. Every walk over that tree recurses forever. The spec copies the world to
a temp project and spawns `ref sync` under a 10 s budget. The child must exit 1 with no signal and print
`token tree cycles at colors.self (src/tokens.ts)`.

Before the guard, the merge walked the cycle until the stack ran out, and sync failed with
`Maximum call stack size exceeded`, which names neither the call, the path nor the file.

> Search terms: tokens, cycle, circular, self-reference, merge, fragment tree, TokenTreeError, CORE-BOUND-02
