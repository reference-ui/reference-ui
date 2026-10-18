# ATM-SITE-99 — A package's published wrapper name is external at its import, while a traced local wrapper spelling the same name stays own

A package built on Reference UI publishes the wrappers it traced as
`jsxElements` on its base system, and a consumer that composes it receives
those names on its host roster. `acme-ui` publishes `AcmeCard`. The consumer
renders `<AcmeCard p="1r" />` imported from `acme-ui` (`Acme.tsx`), and also has
its own `AcmeCard` in `src/AcmeCard.tsx`, a wrapper that forwards `StyleProps`
into Reference's `Div`, rendered as `<AcmeCard p="2r" />` (`Local.tsx`).

Ownership comes from the binding, and the roster cannot override it. The
`acme-ui` binding ends at an installed package, so that tag is external even
with `AcmeCard` on the roster: with one composed upstream
(`upstreamSystems: ['upstream']`) its `p` plans and paints `upstream__p_1r`, and
no `@reference-ui/lib__p_1r` class exists. The local binding ends at a project
file that tracing discovers (`tracedJsxHosts: ['AcmeCard']`), so that tag is an
own host and plans `@reference-ui/lib__p_2r`, with or without the roster entry.

The spec compiles twice: the default request (no roster, no upstream; the
goldens), where tracing alone makes the local wrapper own, and Core's request
with `AcmeCard` on the roster (`jsxHosts: ['AcmeCard']`, the upstream's published
name) and the upstream. Nothing is configured by the user. Siblings: ATM-SITE-96
(primitive name), ATM-SITE-97 (barrel re-export), ATM-SITE-98 (`css` wrapper),
ATM-SITE-56 (traced discovery), ATM-SITE-95 (published owned props).

> Search terms: ownership, provenance, jsxElements, published wrapper, upstream roster, name collision, traced host, tracedJsxHosts, local wrapper, package import, external component, upstreamSystems
