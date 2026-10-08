# ATM-SITE-55: Site Identity Through Re-Exports (Zero Config)

Pins the SPEC-V2-76 identity rider (S12): a consumer wrapper module
(`export { css } from '@reference-ui/react'`) carries site identity to
its importers with zero config — the binding walk that replaces Panda's
`importMap` (`import_map.rs`, 13 tests).

Live arms (each extracts): direct wrapper re-export plus consumer-side
alias (`App.tsx`), wrapper-side alias (`Aliased.tsx`), two-hop chain
(`Chain.tsx`), local re-export of an import (`Local.tsx`), star
re-export (`Star.tsx`), namespace member `ui.css` (`Ns.tsx`), default
re-export (`Def.tsx`), named and namespace `recipe` (`Recipe.tsx`,
`Ns.tsx`), and a JSX host (`Hosts.tsx`). `ValueControl.tsx` proves the
walk disturbs nothing: direct Reference identity and const-value
resolution behave exactly as before.

Miss arms (each a silent non-site — zero wants, zero diagnostics, the
SPEC-V2-38 unmatched-callee precedent): a consumer declaration named
`css` (`MissShadow.tsx`), a foreign-package origin (`MissForeign.tsx`),
a re-export cycle (`MissCycle.tsx`, guard terminates), a missing export
(`MissMissing.tsx`), an unresolvable specifier (`MissAbsent.tsx`), and a
default import through a star (`MissDefaultStar.tsx` — stars never
carry `default`).

Fences: the walk is relative-only — bare and aliased specifiers
(`@/ui`) wait for the Ph4 resolver (ATM-SITE-54) and are deliberately
unpinned here. Namespace VALUE imports (`import * as t`, S13) and
default-object VALUES are the optional SUPERIOR rider: deferred, not
refused — they need the resolver's export value tables (crew-B slice),
and building a second walk for them would fork the architecture. The
seam is ready (`ImportRef` already carries `*`/`default` + specifier).
