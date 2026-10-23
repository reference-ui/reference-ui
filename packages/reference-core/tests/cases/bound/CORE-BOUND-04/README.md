# CORE-BOUND-04 — an include pattern that expands past 1,024 globs, or nests braces past 64 levels, fails ref sync inside 10 s with a config error naming the pattern

An include pattern's braces expand into one glob per alternative, so `{a,b}` written 24 times asks for 16,777,216
globs, and the expansion builds every one of them. The spec runs two legs, each in a temp copy of the world whose
`ui.config.ts` is rewritten as a string (as CORE-SYNC-08 does): `src/` plus `{a,b}` 24 times, and `src/` plus a
brace nest 65 levels deep. Each leg spawns `ref sync` under a 10 s budget and expects exit 1 with no signal, and a
config error that names the pattern: `expands to more than 1,024 globs` or `nests braces deeper than 64 levels`.

Before validation checked braces, the first leg ran V8 out of memory and the second synced.

> Search terms: include, brace expansion, glob, alternatives, nesting, config validation, expandBraces,
> brace-limits, CORE-SYNC-08
