# NEO-TOKEN-11 — keyframes() emits @keyframes in @layer global and animations tokens reference them

The world registers `fadeIn` via `keyframes()` plus an `animations.fade.quick`
token whose value names it, and paints one probe with `animation:
'fade.quick'`. The spec checks the sheet prints `@keyframes fadeIn` exactly
once inside `@layer global`, the token layer carries
`--animations-fade-quick`, the utility consumes it by `var()`, and the probe
computes `animation-name: fadeIn` like its inline reference.

Evidence: `[panda-v1]`
`generator/__tests__/generate-keyframes.test.ts` ("default keyframes" prints
`@keyframes` per theme entry); `[lib]` 31 keyframes
(`lib-sheet-styles-css.md`); `[atm]` P1 #15, ATM-LAYER-05.

> Search terms: motion, loop, replay, token/keyframes, token/animation, NEO-TOKEN-13
