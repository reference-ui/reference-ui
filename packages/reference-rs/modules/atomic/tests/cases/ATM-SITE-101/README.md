# ATM-SITE-101 — A workspace package this sync compiles, imported by its bare name through its node_modules link, is own; once it publishes a system of its own, its tags back under that system

Plan gap 1, the monorepo with one sync. The case input is a pnpm workspace:
the app entry imports `Card` from `@acme/ui` by its bare name,
the mock `ui` package names itself `@acme/ui` with a `main` entry, and
the installed `@acme/ui` link is a symlink to the mock package, the link pnpm makes.
`Card` forwards its props into `Div` from `@reference-ui/react`. The default
compile spans the whole tree, so the package's source is one of this compile's
own files.

The bare specifier is followed to where it lands, not judged by its spelling:
`@acme/ui` resolves through the link into the mock package source, a compile
source, so the identity walk continues into it, the trace admits `Card`, and
`<Card bg="red" />` backs under own: `@reference-ui/lib__bg_red`, painted in the
utilities layer, with no diagnostic. Composing lib (`upstreamSystems:
['reference-ui']`, Core's primitive roster) changes nothing: the class stays
own and nothing is backed under `reference-ui`.

Twin: the same tree after the mock package runs a sync of its own, so it publishes
`.reference-ui/system/baseSystem.mjs` naming `acme` (built in a scratch copy at
verify time). The package's own system is the evidence that it renders through
its own runtime, so the tag is `@acme/ui`'s even though its source is in the
include set. Composing lib only (partly composed) backs `bg` under no system and
warns once at the tag, naming `@acme/ui`, `acme` and the `@acme/ui/baseSystem`
fix; composing `acme` too backs `acme__bg_red` alone and the warning is gone.
Nothing is configured by the user.

Siblings: ATM-SITE-102 (a built workspace package borrowing the app's runtime),
ATM-SITE-100 (unbacked warning), ATM-SITE-96 (installed package with a
published system), CORE-CHAIN-17 (the same monorepo through Core).

> Search terms: monorepo, workspace package, pnpm, node_modules symlink, bare specifier, gap 1, own, traced wrapper, provenance, package directory, published system, two syncs, baseSystem, EXTERNAL-UNBACKED, partly composed, backing
