# ATM-SITE-105 — A styled component tag no trace admits backs under own unless a package or a composed upstream renders it: project, runtime-borrowing and unbound tags are own, an upstream's published name is that upstream's

The capitalised spelling no longer decides backing. `App.tsx` writes four styled
component tags that no trace and no roster admit:

- `<Badge bg="red" />`: a project component made by a higher-order function
  (`withTone(Div)`) the trace cannot see through (`Local`).
- `<Panel bg="blue" />`: from `@acme/panel`, a workspace package linked at
  `node_modules/@acme/panel` whose only code on disk is its built `dist`, outside
  the compile sources. It publishes no system and its `@reference-ui/react`
  resolves to this project's `.reference-ui/react`, so it borrows the own runtime
  (`Local`).
- `<UpstreamCard p="2r" />` and `<Mystery color="green" />`: no binding at all,
  the names an MDX components map or a global provides (`Unbound`).

A tag nobody traces or publishes renders through the own runtime if it forwards
its style props at all, and they are dead weight if it does not, so each backs
under own: the standalone compile paints `@reference-ui/lib__bg_red`,
`@reference-ui/lib__bg_blue`, `@reference-ui/lib__p_2r` and
`@reference-ui/lib__c_green` beside the `<Div p="1r">` control.

Core's request composes lib and `acme` (`upstreamSystems: ['reference-ui',
'acme']`) and says `acme` publishes `UpstreamCard` (`upstreamHosts`). The
published name backs under `acme` alone (`acme__p_2r`); `Badge`, `Panel` and
`Mystery` stay own; nothing is backed under `reference-ui`, and nothing warns.
Nothing is configured by the user.

Siblings: ATM-SITE-102 (a traced runtime-borrowing package), ATM-SITE-99
(published wrapper name), ATM-SITE-56 (zero-config discovery), ATM-SITE-103
(a foreign package is silent).

> Search terms: untraced, local component, unbound tag, MDX components map, global, upstreamHosts, published name, capitalised spelling, is_component_tag, own, spray, built workspace package, borrows runtime, higher-order component, backing
