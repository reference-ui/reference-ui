# CORE-TOKEN-07 — decimal and fraction rhythm (0.5r, 1/2r) paint through escaped classes, and decimal token keys print kebab vars

The world paints three probes: `p: '0.5r'` and `p: '1/2r'` rhythm sugar
plus a named `p: '0.5'` decimal spacing token, over a `0.25rem` root. The
spec checks the rhythm utilities lower to `calc` against the root with
escaped selectors (`.p_0\.5r`, `.p_1\/2r`), the named decimal prints the
kebab var (`--spacing-0-5`, class `.p_0\.5`), the sheet carries no invalid
slash var, and all three probes compute 2px like their inline references.

Evidence: reference-lib rhythm scale;
Panda v1 escape tests; ATM-RHYTHM-02/03, ATM-NAME-04/07.

> Search terms: base step, half-step, r suffix, token/rhythm, token/spacing, CORE-TOKEN-08, ATM-RHYTHM-03
