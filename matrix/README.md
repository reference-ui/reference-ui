# Reference UI Matrix

Consumer-style proving ground for multi-package `extends`/`layers` topologies and the MCP surface.
It proves what local tests and a single environment cannot cover, run across bundlers and React
runtimes by the Dagger pipeline.

The shared `@fixtures/*` packages are the packed dependencies the suites
consume. The chain suites (T1–T18) are each a small app with a UI-config
topology and Playwright contract specs; T1–T3 and T16–T18 add node-side
runtime suites. The MCP standard suite runs 19 unit files: 12 against one
shared server, 6 booting isolated servers, 1 pure unit.

For local IDE readiness, run `pnpm pipeline setup --sync` from the repo
root: it installs workspace dependencies and runs each matrix package's
`sync` script (`ref sync`) so generated packages and types are present.

## Composition contract

Every published library exposes a `baseSystem` boundary: `name` (the
system identity), `fragment` (the portable config-time bundle),
`fragments` (named fragment nodes, upstream first and its own last),
`streams` (portable per-system stylesheet blocks), and `jsxElements`
(published host metadata). The rule is simple: `extends` consumes the
published `fragment` surface, `layers` consumes the published `streams`
surface. `extends` adopts config, types, and styles; `layers` adopts
styles only — layered tokens never enter the consumer config or type
surface. Fragment transitivity is owned by `fragment`, style transitivity
by `streams`: styles can travel transitively through either mode
(including layered styles through an extended package), while config and
types travel through `extends` alone. Chains are artifact chains: a
package publishes a `baseSystem`, another consumes it and publishes a new
one. A shared base reached through two branches evaluates once, at its
first occurrence; a branch's override survives in either order unless a
later system writes that path itself (E1–E6).

Ordering: composition is bucketed, never interleaved. Upstream CSS
assembles `extends` first, then `layers`; the top-level `@layer` prelude
reads upstream names first, then the local system layer, which is always
present and always last. T9 asserts the prelude order on a 2-extends /
2-layers mix. A same-library-in-both-buckets line is allow-and-document
(T8, coded): the package may appear in both buckets, upstream CSS is not
deduped, the extends-side fragment is adopted and the layers side adds
the CSS again.

## The kept gate

Fifteen suites stay, each installing from packed tarballs via the staged
registry with setup in a virgin container on every run, so each one
re-proves the install dimension. Everything provable natively lives in
Core cases or Rust seam tests instead.

| Suite | What it proves |
| --- | --- |
| `@matrix/chain-t1` | Single extend: one upstream contributes fragment + tokens/types + portable CSS. |
| `@matrix/chain-t2` | Single layer: portable CSS only, no token/type adoption. Sole single-mode `layers` prover. |
| `@matrix/chain-t3` | Hybrid: `extends` and `layers` at one boundary. |
| `@matrix/chain-t6` | Transitive extend: the app extends only the outer package, which republishes its base. Declares `vite7` and `webpack5`, the only kept suite with a webpack leg. |
| `@matrix/chain-t7` | Diamond: two upstreams sharing one base, both extended. |
| `@matrix/chain-t8` | Policy proof: the same upstream in `extends` and `layers` at once (coded allow-and-document). |
| `@matrix/chain-t9` | Full mix: 2 extends + 2 layers with the `@layer` prelude order asserted. |
| `@matrix/chain-t10` | Extend chain plus an app-level layered library; layered tokens must not leak. |
| `@matrix/chain-t11` | Parallel extend chains: two independent transitive paths at one boundary. |
| `@matrix/chain-t12` | Diamond base, mixed branches: one layered, one extended. |
| `@matrix/chain-t13` | Parallel extend chains plus a shared app-level layer. |
| `@matrix/chain-t16` | Prebuilt aliased-host composition: every emitted class has a backing rule, zero `no compiled class` warnings, shell computed styles apply. |
| `@matrix/chain-t17` | Consumer style props on prebuilt components: token, raw value, `css` prop, condition and tone paint through rules backed under each package's published systems. |
| `@matrix/chain-t18` | Component ownership by provenance: a tag imported from a package is backed under that package's published systems only, whatever its name or import shape; a partly composed app warns once per styled tag instead of spraying. |
| `@matrix/mcp` | The whole MCP standard against the shipped artifact, including packed-boundary `_private` legs. |

Still uncovered: T4 (parallel extends) and T5 (parallel layers) have no
tiers, and depth-3 chains have no tier. The mixed tiers (T3/T9/T10/T12/
T13/T16/T17/T18) exercise `layers` legs in combination; T2 is the
isolated single-mode proof. `chain-t2` and `chain-t8` double as secondary
Core proof for bundler and runtime spread.

Run the gate, one package at a time:

```bash
pnpm agent test --packages=@matrix/chain-t1
pnpm agent test --packages=@matrix/chain-t2
pnpm agent test --packages=@matrix/chain-t3
pnpm agent test --packages=@matrix/chain-t6 --full   # runs the vite7 and webpack5 legs; a plain run is vite7 only
pnpm agent test --packages=@matrix/chain-t7
pnpm agent test --packages=@matrix/chain-t8
pnpm agent test --packages=@matrix/chain-t9
pnpm agent test --packages=@matrix/chain-t10
pnpm agent test --packages=@matrix/chain-t11
pnpm agent test --packages=@matrix/chain-t12
pnpm agent test --packages=@matrix/chain-t13
pnpm agent test --packages=@matrix/chain-t16
pnpm agent test --packages=@matrix/chain-t17
pnpm agent test --packages=@matrix/chain-t18
pnpm agent test --packages=@matrix/mcp
```
