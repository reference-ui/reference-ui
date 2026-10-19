# STT-PKG-04 — A package's exports source entry wins over a top-level types declaration

Break-it probe: fixture-exports-entry has "types": "./index.d.ts" beside "exports": { ".": "./index.tsx" }.
The declaration has no body; the wrapper lives in the index. Source tracing must follow the exports entry,
so AppCard and PackageCard both trace. Claim: STT-15 (a package subpath listed in exports resolves and traces)
and STT-16 (a wrapper forwarding into an installed package traces).
The `fixture-exports-entry` package is committed with the case; compile remaps that folder to node_modules.
