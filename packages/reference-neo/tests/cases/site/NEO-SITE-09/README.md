# NEO-SITE-09 — a string `@media` key is an at-rule, not a selector

The world calls `css({ width: '50px', '@media (min-width: 400px)': {
width: '60px' } })`. The spec checks the sheet wraps the 60px rule in a
real `@media` block and the node paints 50px/60px across a viewport resize.

Evidence: `[atm]` ATM-COND-11.

> Search terms: responsive, breakpoint, quoted key, site/at-rule
