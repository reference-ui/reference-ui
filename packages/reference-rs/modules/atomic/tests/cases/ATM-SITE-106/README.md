# ATM-SITE-106 — A built workspace package that imports @reference-ui/react is own on the first sync, before the runtime it borrows is generated: a link that points nowhere yet, or none at all, is where this sync puts the runtime

The monorepo's built shape on its very first sync. `@acme/panel` is a workspace
package linked at `node_modules/@acme/panel`; its `main` is its built
bundle, outside the compile sources, which imports `Div` from
`@reference-ui/react` and keeps it external. It publishes no system. This project
has not synced yet, so `.reference-ui/react` does not exist: the committed tree
links `node_modules/@reference-ui/react` to it all the same (a link that points
nowhere, as a clean leaves it), and the twin, built at verify time, has no
`@reference-ui` scope in `node_modules` at all (a fresh checkout).

`App` writes `<Panel bg="red" />` beside an own `<Div p="1r">`. The package's
code imports `@reference-ui/react`, and from its directory that import climbs to
this project's `node_modules`, where the sync links the runtime it is about to
generate. So the package borrows this compile's runtime whether or not the
runtime exists yet: its binding is project code (`Local`), and `bg` backs under
own as `@reference-ui/lib__bg_red`, with no diagnostic. The twin composes lib
(`upstreamSystems: ['reference-ui']`) and changes nothing: still own, nothing
under `reference-ui`. Nothing is configured by the user.

Siblings: ATM-SITE-105 (the same package after a sync, untraced, own),
ATM-SITE-102 (its source in the include set, traced), ATM-SITE-107 (a linked
package not built on Reference UI is silent).

> Search terms: first sync, fresh checkout, runtime not generated, dangling link, broken symlink, node_modules/@reference-ui/react, borrows runtime, own runtime, workspace package, built dist, chicken and egg, package directory verdict, OwnRuntime, Local, silent drop
