# CORE-BOUND-08 world

A consumer whose include reads `src/(a|b)/*.ts` as `src/{a,b}/*.ts`. `src/a`, `src/b` and `src/c` each hold one styled file, in
red, blue and green; the include reaches the first two. The spec copies this folder into temp projects and syncs them there.
