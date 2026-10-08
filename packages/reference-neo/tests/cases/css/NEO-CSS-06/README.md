# NEO-CSS-06 — Token refs inside gradient function values resolve and paint

The world calls `css()` with a `linear-gradient()` background whose stops
are `{colors.*}` refs, the way a lib author themes a gradient. The spec
checks the sheet carries exactly that one utility with both refs expanded
to vars, and the painted gradient resolves to the two token colors.

Evidence: `[atm]` ATM-TOKEN-08; `[panda-v1]`
`vendor/panda-v1/packages/core/__tests__/gradient.test.ts`
"bgGradient with token references".

> Search terms: radial-gradient, color stops, conic-gradient, repeating-linear-gradient, tokenized stops, css/gradients, css/token-refs
