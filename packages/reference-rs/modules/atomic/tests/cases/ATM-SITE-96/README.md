# ATM-SITE-96 — A primitive-named tag imported from an installed package is external, so its style props back the package's qualifier, never the app's

A package built on Reference UI bundles its own generated runtime, bound to its
own system name, so every class its components mint carries that name. `acme-ui`
is installed in the case (`input/node_modules/acme-ui`) and publishes its system,
`acme`, at `.reference-ui/system/baseSystem.mjs`; it exports a `Button`. The consumer writes `<Button color="blue" />` with it, and
also renders Reference's own `Button` (imported as `OwnButton` from
`@reference-ui/react`) with `bg="red"` as the control.

The tag gate decides ownership by where the binding ends, not by the name. Core
always sends the primitive roster, so `jsxHosts` names `Button`; the name match
must not make the package's `Button` an own host. Its `color` backs under the
system the package renders through: with lib and acme composed
(`upstreamSystems: ['reference-ui', 'acme']`) it plans `acme__c_blue` and paints
that class in the utilities layer, and nothing else. No
`@reference-ui/lib__c_blue` or `reference-ui__c_blue` class exists anywhere: an
own class, or one under another composed system, would back nothing the
package's runtime asks for. The `Button` from `@reference-ui/react`
stays own under the same roster name and plans `@reference-ui/lib__bg_red`.

The spec compiles twice: the default request (no roster, no upstream; the
goldens, where the package want backs under no system and the tag reports
`ATM-W-EXTERNAL-UNBACKED` naming `acme`, ATM-SITE-100) and Core's request with
the roster and both upstreams. Nothing is configured by the user. Siblings: ATM-SITE-97 (barrel re-export), ATM-SITE-98
(`css` wrapper), ATM-SITE-99 (published wrapper name), ATM-SITE-95 (compiled
package owned props), CORE-CHAIN-08 (fan-out across composed systems).

> Search terms: ownership, provenance, package import, primitive name, Button, external component, foreign runtime, fan-out, upstreamSystems, jsxHosts roster, TagProvenance, own host, backing, published system, no spray
