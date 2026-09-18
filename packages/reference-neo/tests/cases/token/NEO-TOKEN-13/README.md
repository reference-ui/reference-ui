# NEO-TOKEN-13 — keyframe bodies resolve token refs and rhythm

The world registers `grow` via `keyframes()` with `{colors.ink}` /
`{colors.brand}` refs and `4r` / `8r` widths, plus an `animations.grow.once`
token whose negative-delay shorthand holds the end state on first paint.
The spec checks `@keyframes grow` prints `var()` refs and rhythm calcs with
no verbatim leftovers, and the probe computes the `to` width and color.

Evidence: `[panda-v1]`
`generator/__tests__/generate-keyframes.test.ts` ("should allow tokens");
`[atm]` ATM-LAYER-10 (RS-16 landed).
