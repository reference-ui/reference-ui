# NEO-CHAIN-10 — a shared base is evaluated once, and E→[D] resolves exactly what D resolved

The diamond is NEO-CHAIN-09's, built from real syncs: the shared base A writes `colors.x = #aa0000`;
branch B extends A and overrides `x = #bb0000`; branch C extends A and writes its own leaf, `cLeaf`;
the diamond D extends `[B, C]` and writes its own leaf, `dLeaf`; the app E extends `[D]` and writes nothing.
The spec syncs each upstream for real, then E, and checks three things:

1. D's published `fragment` carries A's bundle once. Only A's bundle holds the literal `#aa0000`, so
   counting that literal counts A's copies.
2. E's evaluated tokens equal D's on every path.
3. E paints the `x` probe as `rgb(187, 0, 0)`, the value D resolves.

Before the fix B and C each republished A, so D's fragment carried A twice (check 1 counted 2), and E ran A
twice too. Now D publishes its named list with A once, and E resolves exactly what D resolves, with x painted
`rgb(187, 0, 0)`, B's value.

Cause (fixed): the same as NEO-CHAIN-09. The fragment list is linearized by name, so a base that two branches
republish appears once in the list a diamond publishes (`src/system/base/fragments.ts`), and every consumer of
that list evaluates it once.

Siblings: NEO-CHAIN-09 (the diamond's override, which this case builds on), NEO-CHAIN-02 (the diamond
through stand-ins), NEO-CHAIN-06 (the real-sync template).

> Search terms: shared base, evaluated once, transitive republish, fragment duplication, extends chain, resolves exactly, real sync, NEO-CHAIN-09, NEO-CHAIN-06
