# ATM-SITE-97 — A project barrel carries its terminal binding: a re-exported package Button is external, a re-exported Reference Button stays own

Apps gather components behind a barrel. `src/ui/index.ts` re-exports `Button`
from `@reference-ui/lib/primitives`, an installed package whose runtime mints
classes under lib's own system name. `src/own/index.ts` re-exports `Button` from
`@reference-ui/react`, the app's own runtime. `Main.tsx` renders
`<Button color="blue" />` through `./ui`; `Page.tsx` renders `<Button bg="red" />`
through `./own`. Both use sites spell the same name and both imports are
relative, so only the end of each re-export chain tells them apart.

The identity walk follows each relative hop to its terminal binding. The `./ui`
chain ends at a bare package specifier, so that `Button` is external: its
`color` is an external want, and with one composed upstream
(`upstreamSystems: ['upstream']`) it plans and paints `upstream__c_blue`, with no
own class. The `./own` chain ends at `@reference-ui/react`, so that `Button` is
an own host and plans `@reference-ui/lib__bg_red`. Tracing discovers the own
barrel's `Button` (`tracedJsxHosts: ['Button']`), and that traced name must not
pull the package's `Button` back to own.

The spec compiles twice: the default request (no roster, no upstream; the
goldens) and Core's request with the primitive roster (`jsxHosts: ['Button']`)
and the upstream. Nothing is configured by the user. Siblings: ATM-SITE-96
(direct package import), ATM-SITE-98 (`css` wrapper), ATM-SITE-99 (published
wrapper name), ATM-SITE-56 (traced discovery).

> Search terms: ownership, provenance, barrel, re-export, index.ts, identity walk, terminal binding, trace_origin, package import, external component, lib primitives, own host, upstreamSystems
