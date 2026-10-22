# CORE-BOUND-03 — a src tree with two self-linked directories and a linked sibling syncs in under 10 s with the CSS of the same tree written out with no links

A symlinked directory that points back at its own parent is a loop: a walk that follows it again and again
never ends, and two such links multiply the work at every level. The world is a consumer whose include reaches
`src/`, with a plain `lib/` folder beside it. The spec copies the world twice, into temp projects it owns.

- The baseline copy writes the linked sibling out as real files: `src/palette/colors.ts` is a copy of
  `lib/colors.ts`, and no loop exists. `ref sync --json` must exit 0 under 10 s.
- The linked copy keeps `lib/` as it is and adds `src/loopA -> .`, `src/loopB -> .` and `src/palette -> ../lib`.
  `ref sync --json` must exit 0 under 10 s too, and its `styled/styles.css` must be byte-identical to the baseline's.

The linked sibling is the positive half: `lib/` sits outside the include, so its colour reaches the sheet only
through `src/palette`, once. A walk that drops the link because `lib/` was walked first fails the equality, and a
walk that follows the loops fails the time budget. Both children are run through the spawned bin with runCli, so
a signal or an overrun reads as a named failure, and disposeWorld removes both temp projects.

> Search terms: symlink loop, self link, linked sibling, linked source, include scope, fragment discovery, native scan, retention, walk, source walk, sync budget, CSS equality, temp world
