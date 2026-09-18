# NEO-SITE-13 — boolean attr `<Div border />` compiles the boolean macro form

The world renders one valueless `border` attr on a `Div` beside a plain
control. The spec checks the sheet carries the width and style utilities
with their style plan, the probe carries both classes, and it paints a
1px solid border while the control stays borderless.

Evidence: `[atm]` ATM-SITE-09 (extract) + ATM-SITE-18 (RS-19 landed).

> Search terms: shorthand, flag attribute, bare attribute, macro expansion, site/boolean-macro
