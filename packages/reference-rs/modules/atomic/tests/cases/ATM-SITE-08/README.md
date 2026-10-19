# ATM-SITE-08 — Styletrace gating

JSX extract uses styletrace plus Reference imports, not PascalCase
guessing. Honest subset: this case has no synced
`.reference-ui/react` primitive declarations, so styletrace does not
list `Div` as an exported wrapper. File-local `@reference-ui/react`
imports are treated as StyleProps hosts (the package styletrace
consults for primitives). Local `<Foo>` is not a host and no PascalCase
match makes it one; as a component nobody traces it lowers under own
(styling plan S3). Contract: SPEC.
