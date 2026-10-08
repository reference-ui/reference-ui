# ATM-SITE-43 — TS enum member fence

Overmatch Ph3 (SPEC-V2-45): enum members with string, numeric, unary-numeric,
boolean, and computed initializers fold through member reads exactly like
a const object. Computed inits (`'a' + 'b'`, `1 + 2`, templates, `!`/`~`,
wrapped) fold resolver-independently, verbatim v2's
`expression_to_literal(init, None)`. Member-reference (`B = A`) and
uninitialized members record nothing — each use warns `DynamicMember`
with siblings kept (v2's lenient rule keeps static siblings too). An
inner `const` shadows the enum name. Boolean members record and refuse
at resolve, planless like bare bools.

Panda: `polish.rs:47` (`enum_member_access_resolves`), numeric `:66`,
uninit-drop `:85`; fence `literal-evaluator.md:67`.
