# CORE-BOUND — hostile inputs that must finish inside a budget

Each case gives Core an input that once crashed or ran away, and proves it ends inside its budget. A child process runs the real work, so a signal or an overrun is a named failure, not a dead worker.

- `CORE-BOUND-07` — a src tree holding a FIFO named pipe.ts and a link to it syncs in under 10 s with the CSS of the tree without them.
- `CORE-BOUND-06` — a src tree with a 7-directory link clique, a 16-level link lattice and a file reached only through a loop-closing link syncs in under 10 s with the CSS of the same tree written out with no links.
- `CORE-BOUND-05` — a real ref sync of 70 files and one file at 2,000 nesting exits 0 with no signal, inside 10 s, and its stylesheet has both colours.
- `CORE-BOUND-03` — a src tree with two self-linked directories and a linked sibling syncs in under 10 s with the CSS of the same tree written out with no links.
- `CORE-BOUND-02` — a tokens() group nested 150 levels fails ref sync with exit 1 naming the 100-level limit, the path and the file.
- `CORE-BOUND-01` — a tokens() tree that contains itself fails ref sync with exit 1 and 'token tree cycles at colors.self (<file>)'.
- `CORE-BOUND-04` — an include pattern that expands past 1,024 globs, or nests braces past 64 levels, fails ref sync inside 10 s with a config error naming the pattern.
