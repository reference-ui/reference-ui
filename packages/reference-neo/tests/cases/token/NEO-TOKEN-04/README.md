# NEO-TOKEN-04 — {colors.pink.400/30} inside a box-shadow mixes inside the shadow

The world paints one probe with `boxShadow: '0 0 0 3px {colors.pink.400/30}'`
and a second element with the same shadow written inline as a `color-mix`
over the token var. The spec checks the sheet carries the curly opacity ref
as a `color-mix` inside the shadow value, and that the probe computes
exactly like the inline reference.

Evidence: `[panda-v1]` `core/__tests__/color-mix.test.ts` "in token reference
with curly brackets" (`{colors.pink.400/30}`); `[atm]` ATM-TOKEN-06,
ATM-TOKEN-08.
