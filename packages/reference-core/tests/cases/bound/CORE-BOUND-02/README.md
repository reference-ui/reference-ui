# CORE-BOUND-02 — a tokens() group nested 150 levels fails ref sync with exit 1 naming the 100-level limit, the path and the file

The world's `tokens()` call nests a group 150 levels deep under `deep`, past the 100-level limit a fragment tree may
reach. The spec copies the world to a temp project and spawns `ref sync` under a 10 s budget. The child must exit 1
with no signal and print `token tree nests deeper than 100 levels at deep.n.….n (src/tokens.ts)`, where the path is
the first node past the limit.

Before the guard, the tree reached the engine and sync failed with `recursion limit exceeded`, which names neither
the call, the path nor the file.

> Search terms: tokens, depth, nesting, limit, merge, fragment tree, TokenTreeError, CORE-BOUND-01
