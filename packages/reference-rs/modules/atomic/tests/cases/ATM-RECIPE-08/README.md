# ATM-RECIPE-08: Recipe Identity From `<Name>Recipe` Bindings

Tests that a `recipe(...)` call with no `className` prop resolves its stem from
an enclosing `<Name>Recipe` declarator (`const chipRecipe = recipe(...)` →
`chip`), emitting the same base/variant/default classes an explicit prop would.
Core parity: `@reference-ui/lib` ships `const summaryChipRecipe = recipe(...)`
with no prop, which core admitted as `summaryChip` (RS-33). A bare `Recipe`
binding and a non-suffixed binding still refuse with the explicit-identity
diagnostic, so the gate keeps its teeth.
