# CORE-BOUND-06 — a src tree with a 7-directory link clique, a 16-level link lattice and a file reached only through a loop-closing link syncs in under 10 s with the CSS of the same tree written out with no links

Each clique, lattice or loop of links multiplies a walk's work when every link path is followed.
One sync of all three is the hostile input this case bounds. The world is a consumer whose include reaches
`src/a/`, with `src/x.ts` kept outside it. The spec copies the world twice, into temp projects it owns, and gives both
the same real files: `src/a/app.ts`, one styled file in each of `src/a/clique/k0` through `k6`, and one styled file in
each of the two directories (`a` and `b`) of every level of `src/a/lattice/n0` through `n15`.

- The baseline has no links. It writes the file the loop reaches out at the path the loop gives it: `src/a/up/x.ts` is a
  real copy of `src/x.ts`. `ref sync` must exit 0 under 10 s.
- The linked project adds `src/a/up -> ..`, which points back at `src/`, so `src/x.ts` is in scope only as
  `src/a/up/x.ts`. It also links every clique directory to the other six, and every lattice directory to both directories
  of the level below. `ref sync` must exit 0 under 10 s too, and its `styled/styles.css` must be byte-identical to the
  baseline's.

The loop-only file is the positive half: a walk that cuts the loop-closing link never lists `src/a/up/x.ts`, so the
equality fails. A walk that follows every link path again multiplies its work and fails the time budget. Both children
are run through the spawned bin, so a signal or an overrun reads as a named failure, and both temp projects are removed
in a finally.

> Search terms: symlink loop, loop-closing link, link clique, link lattice, include scope, alias path, source walk, native scan, tasty scan, sync budget, CSS equality, temp world
