# ATM-SITE-97 — A project barrel carries its terminal binding: a re-exported package Button is external, a re-exported Reference Button stays own

Apps gather components behind a barrel. The `ui` barrel re-exports `Button`
from `@reference-ui/lib/primitives`, an installed package (installed for the case)
whose runtime mints classes under the systems its published `baseSystem` streams
name, `reference-icons` and `reference-ui`. The `own` barrel re-exports `Button` from
`@reference-ui/react`, the app's own runtime. `Main` renders
`<Button color="blue" />` through `./ui`; `Page` renders `<Button bg="red" />`
through `./own`. Both use sites spell the same name and both imports are
relative, so only the end of each re-export chain tells them apart.

The identity walk follows each relative hop to its terminal binding. The `./ui`
chain ends at the installed package's directory, so that `Button` is external:
its `color` backs under the package's systems that are composed, and with lib
and acme composed (`upstreamSystems: ['reference-ui', 'acme']`) it plans and
paints `reference-ui__c_blue` only, with no own class and nothing under `acme`. The `./own` chain ends at `@reference-ui/react`, so that `Button` is
an own host and plans `@reference-ui/lib__bg_red`. Tracing discovers the own
barrel's `Button` (`tracedJsxHosts: ['Button']`), and that traced name must not
pull the package's `Button` back to own.

The spec compiles twice: the default request (no roster, no upstream; the
goldens, where the package want backs under no system and the tag reports
`ATM-W-EXTERNAL-UNBACKED`, ATM-SITE-100) and Core's request with the primitive
roster (`jsxHosts: ['Button']`) and both upstreams. Nothing is configured by the user. Siblings: ATM-SITE-96
(direct package import), ATM-SITE-98 (`css` wrapper), ATM-SITE-99 (published
wrapper name), ATM-SITE-56 (traced discovery).

> Search terms: ownership, provenance, barrel, re-export, index, identity walk, terminal binding, trace_origin, package import, external component, lib primitives, own host, upstreamSystems
