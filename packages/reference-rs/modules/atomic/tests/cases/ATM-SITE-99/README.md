# ATM-SITE-99 — A package's published wrapper name is external at its import, while a traced local wrapper spelling the same name stays own

A package built on Reference UI publishes the wrappers it traced as
`jsxElements` on its base system, and a consumer that composes it sends those
names with its compile request, keyed by system (`upstreamHosts`) and apart
from its own host roster. `acme-ui`, installed in the case with its system
`acme` published, publishes `AcmeCard`. The consumer renders
`<AcmeCard p="1r" />` imported from `acme-ui` (`Acme.tsx`), and also has its own
`AcmeCard` in `src/AcmeCard.tsx`, a wrapper that forwards `StyleProps` into
Reference's `Div`, rendered as `<AcmeCard p="2r" />` (`Local.tsx`).

Ownership comes from the binding, and the published name cannot override it.
The `acme-ui` binding ends at an installed package, so that tag is external:
with lib and acme composed (`upstreamSystems: ['reference-ui', 'acme']`) its `p`
plans and paints `acme__p_1r` only, and no `@reference-ui/lib__p_1r` or
`reference-ui__p_1r` class exists. The
local binding ends at a project file that tracing discovers
(`tracedJsxHosts: ['AcmeCard']`), so that tag is an own host and plans
`@reference-ui/lib__p_2r`, whether or not an upstream publishes the name.

The spec compiles twice: the default request (no roster, no upstream; the
goldens), where tracing alone makes the local wrapper own and the package tag
reports `ATM-W-EXTERNAL-UNBACKED` because nothing is composed to back it
(ATM-SITE-100), and Core's request: the primitive roster in `jsxHosts`, both
upstreams, and acme's published name in `upstreamHosts: { acme: ['AcmeCard'] }`.
Nothing is configured by the user. Siblings: ATM-SITE-96 (primitive name),
ATM-SITE-97 (barrel re-export), ATM-SITE-98 (`css` wrapper), ATM-SITE-56 (traced
discovery), ATM-SITE-95 (published owned props).

> Search terms: ownership, provenance, jsxElements, published wrapper, upstream roster, name collision, traced host, tracedJsxHosts, local wrapper, package import, external component, upstreamSystems, upstreamHosts
