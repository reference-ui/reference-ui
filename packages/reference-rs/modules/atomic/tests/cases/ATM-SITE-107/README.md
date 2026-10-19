# ATM-SITE-107 — A linked workspace package not built on Reference UI is silent even where this project's runtime resolves from it: a linked directory is own code only when it imports @reference-ui/react or lies in the include set

Owner ruling (plan section 11.2) for the monorepo. Two workspace packages are
linked into `node_modules` the way pnpm links them, each with a built `dist`
outside the compile sources and no published system:

- `@acme/icons` (the mock `icons` package) is a plain icon package: `<StarIcon color
  size>` draws an SVG whose stroke is `color`. Nothing in it imports a Reference
  runtime.
- `@acme/panel` (the mock `panel` package) forwards its props into `Div` from
  `@reference-ui/react`, which it keeps external.

The project has synced: `node_modules/@reference-ui/react` links its generated
`.reference-ui/react`, and from either package directory that specifier climbs to
it. Where the runtime would resolve is not evidence that a package uses it, so
the verdict also asks whether the package is Reference code for this app: its
code (the manifest's root entries) imports `@reference-ui/react`, its manifest
depends on it, or this compile's include set reaches inside it.

`App` writes `<StarIcon color="red" size={16} />` and `<Panel bg="blue" />`
beside an own `<Div p="1r">`. `@acme/panel` borrows the runtime, so `bg` backs
under own as `@reference-ui/lib__bg_blue`. `@acme/icons` is a foreign package:
no want, no style plan, no class and no diagnostic, standalone and with lib
composed (`upstreamSystems: ['reference-ui']`). Nothing is configured by
the user.

Siblings: ATM-SITE-103 (an installed package not built on Reference UI),
ATM-SITE-105 (a runtime-borrowing package, untraced), ATM-SITE-106 (the same
borrowing on the first sync), ATM-SITE-101 (a workspace package in the include
set).

> Search terms: workspace package, linked package, pnpm link, not built on Reference UI, icon package, foreign, silent, owner ruling, borrows runtime, imports @reference-ui/react, include set, own code, package directory verdict, style-named props, no spray
