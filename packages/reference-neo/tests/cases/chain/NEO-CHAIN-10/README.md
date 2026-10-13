# NEO-CHAIN-10 — a shared base is evaluated once, and E→[D] resolves exactly what D resolved

The diamond is NEO-CHAIN-09's, built from real syncs: the shared base A writes `colors.x = #aa0000`;
branch B extends A and overrides `x = #bb0000`; branch C extends A and writes its own leaf, `cLeaf`;
the diamond D extends `[B, C]` and writes its own leaf, `dLeaf`; the app E extends `[D]` and writes nothing.
The spec syncs each upstream for real, then E, and checks three things:

1. D's published `fragment` carries A's bundle once. Only A's bundle holds the literal `#aa0000`, so
   counting that literal counts A's copies.
2. E's evaluated tokens equal D's on every path.
3. E paints the `x` probe as `rgb(187, 0, 0)`, the value D resolves.

This case is red until the fix slice lands. Today B and C each republish A, so D's fragment carries A
twice and check 1 counts 2. E evaluates D's fragment as one string, so E runs A twice too. Check 2 holds
today, since E and D agree on every path, both on the wrong `x`. Check 3 paints `rgb(170, 0, 0)`, A's value.

Cause: the same as NEO-CHAIN-09. `createPortableFragmentBundle` (`src/system/base/fragments.ts`) concatenates
upstream fragments without deduping, so a base that two branches republish appears twice in the fragment
a diamond publishes, and every consumer of that fragment evaluates it again.

Siblings: NEO-CHAIN-09 (the diamond's override, which this case builds on), NEO-CHAIN-02 (the diamond
through stand-ins), NEO-CHAIN-06 (the real-sync template).

> Search terms: shared base, evaluated once, transitive republish, fragment duplication, extends chain, resolves exactly, real sync, NEO-CHAIN-09, NEO-CHAIN-06
