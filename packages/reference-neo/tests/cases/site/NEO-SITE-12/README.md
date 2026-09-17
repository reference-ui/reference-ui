# NEO-SITE-12 — unlisted `<Random>` and lowercase `<div color>` are not hosts

The world renders an unlisted `<Random fontSize>` and a lowercase `<div
color>` beside a `<Div mt>` control. The spec checks the sheet carries
only the control utility, neither probe carries a class, and neither paints.

Evidence: `[atm]` ATM-SITE-08; anti-goal `output.test.ts` L3057; `[decision D11]`.
