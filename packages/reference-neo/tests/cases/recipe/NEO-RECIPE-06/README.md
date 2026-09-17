# NEO-RECIPE-06 — recipe class identity is `${system}__${className}`, and a duplicate fails sync

The world defines one `badge` recipe with a size axis. The spec checks
every emitted class carries the `neo-recipe__badge` prefix in the sheet
and the DOM, each selection paints, and a second world defining the same
`className` twice fails `sync()` naming the duplicate.

Evidence: `[atm]` ATM-RECIPE-06 (P2 #18).
