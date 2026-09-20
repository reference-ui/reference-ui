---
date: 2026-09-20
cycle: wave6
module: neo/fragments/extends
theories_spent: 1
verdict: break-found
---

# Upstream `_private` tokens leak across extends into the downstream spec

## Hypothesis

Gap: `tokens()` documents that `_private` subtrees "are stripped from
any downstream consumer that pulls in the package via `extends`, and
are hidden from the token surface"
(`packages/reference-neo/src/fragments/api/tokens.ts:31-34`), and the
Rust side implements exactly that stripping at the extends boundary
(`BaseSystem::from_specs`, `BAS-EXTEND-03`). But neo's TS evaluation
path (`evaluatePreparedFragments`) concatenates upstream fragment
bundles into the same evaluation script and deep-merges everything
into ONE `EvaluatedSystemSpec`, which sync hands to a single-spec
`compile()` — the multi-spec boundary where Rust strips `_private`
never exists in this path, and nothing in TS strips instead. Red test:
evaluate a downstream project whose `extends` upstream defines
`colors._private.upstreamSecret` alongside a public token, and assert
the downstream `spec.tokens` contains no `_private` key.

## Verdict

`break-found`. Repro: `/tmp/doom-wave6-r-private-leak.mts`, run with
the repo tsx binary
(`packages/reference-neo/node_modules/.bin/tsx /tmp/doom-wave6-r-private-leak.mts`,
exit 1). Firsthand result: downstream `spec.tokens.colors` contains
`_private.upstreamSecret` verbatim, and spec provenance advertises
`colors._private.upstreamSecret` under the upstream source. Violated
contract: the `tokens.ts` header `_private` scoping rule plus the
`BAS-EXTEND-03` intent ("Internal tokens of base libraries must never
leak into downstream application autocomplete"). Severity: user-facing
— the leaked token flows into the published `evaluated-system.json`,
downstream typegen/autocomplete, and the transitive portable fragment
bundle (downstream-of-downstream inherits the leak), while the owning
package's own `_private` use (NEO-TOKEN-09) stays correct. Untried
theories banked for scheduling: (2) font-weight tokens silently win
over explicitly authored `tokens({fontWeights})` in `mergeCollectedSpec`;
(3) `tokenLeafPaths` drops child paths under value-carrying parents,
under-reporting provenance keys.
