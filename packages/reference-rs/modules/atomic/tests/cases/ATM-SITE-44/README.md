# ATM-SITE-44 — param type-literal fence

: a function parameter annotated with a
`TSTypeLiteral` folds required string/number/boolean literal members through
member reads (`props.color`) and destructured twins (`{ color }`, renames).
Patterns are per-name lenient, verbatim v2's `resolve_pattern_path`: rest
binds the unlisted members (`{...all}`), defaults fire only on missing keys
(`{color='blue'}` folds from a present source), and unresolvable names
shadow while their siblings still fold. The annotation itself stays
all-or-nothing, verbatim v2: untyped, optional-member, partial (`unknown`
sibling), non-literal (`string`), and nested-literal annotations refuse
whole — each use warns with siblings kept.
