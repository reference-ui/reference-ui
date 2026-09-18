# NEO-TOKEN-03 — red.500/40 paints color-mix(in srgb, var(--colors-red-500) 40%, transparent)

The world paints one probe with the `red.500/40` slash-opacity token and a
second probe with a slash that belongs to the CSS value (`rgb(251 146 60 /
0.3)`). The spec checks each probe's computed background against a reference
element carrying the same declaration inline, so the engine's emit and the
browser's paint must agree.

Evidence: `[panda-v1]` `core/__tests__/color-mix.test.ts`; `[lib]` 25 mixes
(contrast: hand-written `oklch`, not slash opacity); `[atm]` P0 #6,
ATM-TOKEN-03/06.
