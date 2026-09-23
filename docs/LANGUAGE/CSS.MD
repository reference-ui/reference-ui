# CSS

**Status**: Living contract (rebuilt verified-true 2026-09-23; every claim
carries file:line proof).
**Scope**: The stylesheet `neo sync` emits and the rules that shape it.

All sheet citations below are the live T1 consumer artifact
(`matrix/tests/chain/T1/.reference-ui/styled/styles.css`, rebuilt by the
merging sync).

## Shape

The served sheet is a merged assembly, not a single block:

1. A top-level `@layer` statement listing the merged set — extends in
   declared order, self last (`@layer extend-library, chain-t1;`, sheet `:1`;
   emitted by `mergePackedStylesheets`,
   `packages/reference-neo/src/sync/packed-css.ts:118-125`).
2. One upstream block per extends entry, verbatim but reset-stripped
   (`@layer extend-library { … }`, sheet `:2`; strip rule
   `packed-css.ts:57-62`).
3. The own block last (`@layer chain-t1 { … }`, sheet `:43`).

Worlds without extends merge nothing: empty upstream css returns the own
block byte-identical (`packages/reference-neo/src/sync/index.ts:118-122`).

Each block opens with the inner prelude
`@layer reset, global, base, tokens, recipes, utilities;` (sheet `:3`, `:44`).

## Reset

`@layer reset` carries the global reset (`box-sizing`, margins, list styles,
reduced-motion guards; sheet `:45-60`). It rides the spec only when
`normalizeCss` is not false (LAYER-04,
`packages/reference-neo/src/sync/index.ts:163-164`; the key defaults true,
`config/types.ts:62-66`). The ONLY reset emitted is the consumer's own —
upstream resets are stripped at merge — so a `normalizeCss: false` consumer
opts its whole subtree out.

## Tokens

- Served (own) vars hoist to `:root` (+ `[data-color-mode=light]`), e.g.
  `--colors-fixture-demo-bg: #0f172a;` (sheet `:61-68`).
- Color-mode variants ride `[data-color-mode=dark]` (sheet `:69-72`).
  `data-color-mode` is the canonical attribute
  (`DATA_COLOR_MODE_ATTR`,
  `packages/reference-neo/src/primitives/runtime/context.ts:14`).
- Upstream vars stay scoped under `[data-layer="<upstream>"]` in the merged
  upstream block (sheet `:5-16`) — never hoisted to the consumer `:root`.
- Token spelling is `--<category>-<path-with-dashes>` (e.g.
  `--colors-light-dark-demo-bg`).

## Utilities

One class per leaf under `@layer utilities`, shaped
`.<system>__<prop>_<value>`: `.extend-library__bg_lightDarkDemoBg`
(sheet `:19`), `.chain-t1__p_4px` (sheet `:78`). Values resolve through
`var(--…)` at paint time.

## Privacy

Upstream `_private` token subtrees are stripped from fragments before they
reach the consumer, and upstream portable blocks merge verbatim (scoped vars
stay under the upstream `data-layer`), so `_private` vars exist only in
upstream scope. Pinned by the T1 `_private` legs
(`matrix/tests/chain/T1/tests/e2e/T1-contract.spec.ts:42-60`): the private
token does not resolve outside its own `data-layer` scope, and a downstream
consumer cannot author against upstream `_private` tokens.
