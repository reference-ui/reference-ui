# ATM-SITE-102 — A workspace package with no system of its own, whose @reference-ui/react resolves to this project's generated runtime, renders through that runtime, so its tags are own

The monorepo's built shape. `@acme/panel` is a workspace package linked at
`node_modules/@acme/panel`; its `main` is its built `dist/index.mjs`, which keeps
`@reference-ui/react` external, and its source (`packages/panel/src`) is in this
sync's include set. It publishes no system. From the package directory,
`@reference-ui/react` resolves through `node_modules/@reference-ui/react` to this
project's generated runtime, `.reference-ui/react` (reduced here to a
`package.json`, `react.mjs` and `react.d.mts`).

`App.tsx` writes `<Panel bg="red" />`. The bare specifier lands in `dist`, which
is not a compile source, so the identity walk ends at the package directory and
reads what is there: no published system, and a runtime import that resolves to
this compile's own runtime. The package borrows this runtime, so its binding is
project code (`Local`), not a package: the trace admits `Panel` from its source,
and `bg` backs under own as `@reference-ui/lib__bg_red`, with no diagnostic.
Composing lib (`upstreamSystems: ['reference-ui']`, Core's primitive roster)
changes nothing: still own, nothing under `reference-ui`. A package directory
read as foreign would have dropped the tag silently, and one judged by its npm
spelling sent it external, under no own class. Nothing is configured by the user.

An untraced tag from such a package (only `dist` on disk, no source in the
include set) is pinned with the other untraced tags in ATM-SITE-105. Siblings:
ATM-SITE-101 (workspace package source in the include set), ATM-SITE-103
(package not built on Reference UI), CORE-CHAIN-17 (the monorepo through Core).

> Search terms: monorepo, workspace package, built dist, borrows runtime, own runtime, @reference-ui/react, generated runtime, .reference-ui/react, package directory verdict, OwnRuntime, Local, provenance, traced wrapper, no published system
