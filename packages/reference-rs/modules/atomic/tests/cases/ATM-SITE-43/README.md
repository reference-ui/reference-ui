# ATM-SITE-43 — TS enum member fence

Overmatch Ph3 (SPEC-V2-45): enum members with string, numeric, unary-numeric,
and boolean initializers fold through member reads exactly like a const
object. Member-reference (`B = A`), computed (`'a' + 'b'`), and uninitialized
members record nothing — each use warns `DynamicMember` with siblings kept
(where v2 drops the whole call). An inner `const` shadows the enum name.
Boolean members record and refuse at resolve, planless like bare bools.

Panda: `polish.rs:47` (`enum_member_access_resolves`), numeric `:66`,
uninit-drop `:85`; fence `literal-evaluator.md:67`.
