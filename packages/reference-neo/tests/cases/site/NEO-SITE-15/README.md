# NEO-SITE-15 — Object ternary arms in a `_hover` prop: both compile, the hovered arm paints

The world renders one `Div` whose `_hover` rides a literal object ternary
over a runtime-only flag, plus a `data-hover` twin. The spec checks the sheet
carries exactly the two hover atoms, the twin paints the flag-chosen arm
without hovering, and a real hover paints the same arm on the probe.

Evidence: `[atm]` ATM-SITE-21; `[lib]` `Tabs.tsx` nested `_hover` ternary
(RS-34); `[decision D11]`.
