# ATM-SITE-55 — Site Identity Through Re-Exports (Zero Config)

Pins the identity rule: a consumer wrapper module
(`export { css } from '@reference-ui/react'`) carries site identity to
its importers with zero config — the binding walk (`extract::identity`)
that replaces Panda's `importMap`.

Live arms (each extracts): direct wrapper re-export plus consumer-side
alias (`App`), wrapper-side alias (`Aliased`), two-hop chain
(`Chain`), local re-export of an import (`Local`), star
re-export (`Star`), namespace member `ui.css` (`Ns`), default
re-export (`Def`), named and namespace `recipe` (`Recipe`,
`Ns`), and a JSX host (`Hosts`). `ValueControl` proves the
walk disturbs nothing: direct Reference identity and const-value
resolution are undisturbed.

Miss cases (each a silent non-site — zero wants, zero diagnostics, the
unmatched-callee precedent): a consumer declaration named
`css` (`MissShadow`), a foreign-package origin (`MissForeign`),
a re-export cycle (`MissCycle`, guard terminates), a missing export
(`MissMissing`), an unresolvable specifier (`MissAbsent`), and a
default import through a star (`MissDefaultStar` — stars never
carry `default`).

Fences: the walk is relative-only — bare and aliased specifiers
(`@/ui`) are deliberately unpinned here (ATM-SITE-54 covers the
resolver). Namespace VALUE imports (`import * as t`) and
default-object VALUES are unpinned here too: they need the resolver's
export value tables, and building a second walk for them would fork the
architecture (`ImportRef` already carries `*`/`default` + specifier).
