# NEO-TOKEN-01 — {colors.red.500} inside a multi-value border shorthand resolves to var(--colors-red-500)

The world paints one probe with `border: '2px solid {colors.red.500}'` and a
second element with the same border written inline as a hex literal. The spec
checks the sheet carries the ref as `var(--colors-red-500)` across the
longhands the engine splits the shorthand into, and that the probe computes
exactly like the hex reference.

Evidence: `[panda-v1]` `core/__tests__/style-decoder.test.ts` "should resolve
references" (`border: '2px solid {colors.red.300}'`); `[lib]` 3 leftover refs
(`lib-sheet-styles-css.md` L8308/L8326/L27410, one failed lower); `[atm]`
ATM-TOKEN-08.
