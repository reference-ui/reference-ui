# CORE-BOUND-08 — an include glob the walk cannot model fails ref sync inside 10 s with a config error naming the pattern and the form to write, and `src/(a|b)/*.ts` syncs the CSS of src/a and src/b but not src/c

An include the project walk cannot model falls back to a per-path loop cut, which is exponential on a lattice of
symlinks, and picomatch and the Rust grammar read some shapes differently (`src/(a|b)/*.ts` is an alternation to one and
literal text to the other). Config validation therefore refuses every shape outside the modeled subset by name, and
reads `(a|b)` as `{a,b}` once. The spec runs four legs in temp copies of the world, each spawning the bin's sync under a
10 s budget:

- Three refused includes (`src/@(a|b)/*.ts`, `src/[[:alpha:]]/*.ts`, `src/**x/*.ts`), each with `ui.config.ts` rewritten
  as a string (as CORE-BOUND-04 does). Each must exit 1 with no signal and print
  `include pattern '<pattern>' <problem>; write <form>`.
- The committed include `src/(a|b)/*.ts`. It must exit 0, and the published stylesheet must carry the colours of
  `src/a/app.ts` and `src/b/app.ts` and not the colour of `src/c/app.ts`.

> Search terms: include, glob, extglob, parentheses, alternation, POSIX class, config validation, include-shapes,
> CORE-BOUND-04
