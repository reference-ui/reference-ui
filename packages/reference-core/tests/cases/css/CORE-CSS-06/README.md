# CORE-CSS-06 — Token refs inside gradient function values resolve and paint

The world calls `css()` with a `linear-gradient()` background whose stops
are `{colors.*}` refs, the way a lib author themes a gradient. The spec
checks the sheet carries exactly that one utility with both refs expanded
to vars, and the painted gradient resolves to the two token colors.

Evidence: ATM-TOKEN-08; Panda v1 test "bgGradient with token references".

> Search terms: radial-gradient, color stops, conic-gradient, repeating-linear-gradient, tokenized stops, css/gradients, css/token-refs
