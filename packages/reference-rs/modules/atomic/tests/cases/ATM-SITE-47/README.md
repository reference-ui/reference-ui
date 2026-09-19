# ATM-SITE-47 — value whitespace collapse

Overmatch Ph3 whitespace canonicalization (SPEC-V2-14).

Structural whitespace runs in authored values collapse to one class and one
declaration: `'Fira  Sans'` twins mint the same atom as `'Fira Sans'`, and a
multiline backtick grid collapses to its single-line twin. Runs inside quoted
substrings survive verbatim (`content: '"x  y"'`, quoted font names). Extract
keeps raw wants (7); resolve canonicalizes to 4 atoms; each twin pair shares
one runtime class. Paint-identical either way, so no browser arm.

Inputs: `twins.ts` (string twins), `grid.ts` (backtick grid twins),
`quotes.ts` (quoted preservation arms).

Panda: `calls.rs:156` (`string_value_whitespace_is_collapsed_outside_quotes`),
`:179` (backtick twin).
