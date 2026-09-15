# ATM-SITE-08

JSX extract uses styletrace plus Reference imports, not PascalCase
guessing. Honest subset: this station has no synced
`.reference-ui/react` primitive declarations, so styletrace does not
list `Div` as an exported wrapper. File-local `@reference-ui/react`
imports are treated as StyleProps hosts (the package styletrace
consults for primitives). Local `<Foo>` is not a host and must not
extract. Contract: [SPEC.md](../../../SPEC.md).
