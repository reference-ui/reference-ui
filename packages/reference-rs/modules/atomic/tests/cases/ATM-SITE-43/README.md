# ATM-SITE-43 — TS enum member fence

: enum members with string, numeric, unary-numeric,
boolean, and computed initializers fold through member reads exactly like
a const object. Computed inits (`'a' + 'b'`, `1 + 2`, templates, `!`/`~`,
wrapped) fold resolver-independently, verbatim v2's
`expression_to_literal(init, None)`. Member-reference (`B = A`) and
uninitialized members record nothing — each use warns `DynamicMember`
with siblings kept (v2's lenient rule keeps static siblings too). An
inner `const` shadows the enum name. Boolean members record and refuse
at resolve, planless like bare bools.
