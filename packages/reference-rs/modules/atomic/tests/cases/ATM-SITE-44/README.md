# ATM-SITE-44 — param type-literal fence

Overmatch Ph3 (SPEC-V2-46): a function parameter annotated with a
`TSTypeLiteral` folds required string/number/boolean literal members through
member reads (`props.color`) and destructured twins (`{ color }`, renames).
All-or-nothing, verbatim v2: untyped, optional-member, partial (`unknown`
sibling), non-literal (`string`), nested-literal, rest, and defaulted params
refuse the whole annotation — each use warns with siblings kept.

Panda: `polish.rs:104` (member), `:142` (destructured twin), `:125`/`:162`
(param drops); fence `literal-evaluator.md:68`.
