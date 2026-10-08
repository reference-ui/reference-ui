# ATM-SITE-53: Identifiers Resolve Through Their Binding

Tests that a value-position identifier resolves through the scope chain
(SPEC-V2-75): a `Card({ color })` param shadows the cross-file
`export const color` (diagnostic, zero wants — never the silent value
that used to mint a ghost), an inner `const tone` shadows the outer
same-named const (innermost leaves only, no union bloat), and the outer
const still resolves at the top level. Imported (`theme.primary`) and
genuinely unbound (`color` in `Stub.tsx`) names keep resolving through
the import lookup stub, so the merge-era cross-file observable stands.
