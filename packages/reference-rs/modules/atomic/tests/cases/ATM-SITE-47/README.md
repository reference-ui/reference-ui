# ATM-SITE-47 — value whitespace collapse

Whitespace canonicalization.

Structural whitespace runs in authored values collapse to one class and one
declaration: `'Fira  Sans'` twins mint the same atom as `'Fira Sans'`, and a
multiline backtick grid collapses to its single-line twin. Runs inside quoted
substrings survive verbatim (`content: '"x  y"'`, quoted font names). Extract
keeps raw wants (7); resolve canonicalizes to 4 atoms; each twin pair shares
one runtime class. Paint-identical either way, so no browser arm.

Inputs: `twins` (string twins), `grid` (backtick grid twins),
`quotes` (quoted preservation arms).
