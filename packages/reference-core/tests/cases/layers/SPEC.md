# LAYERS — visual-only upstream systems

This group proves the `layers` contract in Core's own loop. A `layers` entry is
a real published base system, and only its `streams` join the cascade: no
fragments, no roster, no types. Every case syncs its upstreams for real because
a stand-in has no `streams`, so computed style and the served sheet are the
oracle, with sheet text pinned beside the paint and never alone.

## Dialect

Authors write `layers: [system]` beside `extends` in `ui.config.ts`. Each entry
is the `BaseSystem` a package's `baseSystem.mjs` carries (`name`, `fragment`,
`streams`; `src/system/base/types.ts:28-37`). The merge runs in bucket order,
extends then layers, with the own entry last
(`src/sync/index.ts:206-210`, `mergeStreams` in `src/system/base/streams.ts`):

    @layer <extends names>, <layers names>, <own>;
    <extends blocks> <layers blocks> <own block>

Each upstream block is reprinted portable, resetless and rootless
(`printUpstreamBlock`, `packages/reference-core/src/system/base/streams.ts:106-115`), so its tokens sit under
`[data-layer="<name>"]`. Upstream names feed the compile request as qualifiers,
extends then layers (`packages/reference-core/src/sync/index.ts:135-143`). Validation checks each field in
full (`validateBaseFields`, `src/config/validate.ts`): synced data on every entry,
streams on every layers entry, and no entry that reaches the config's own name or
repeats within its field (`src/system/base/validate.ts`). Once both fields pass, no
system may be named in both (`validateSharedBaseSystems`).

## Rules

- Real sync, never stand-ins. Each case syncs its upstream through the real
  `sync()`, the CORE-CHAIN-06 pattern, then extends the consumer config mid-run.
- The committed `ui.config.ts` imports nothing. An import of an unsynced
  `baseSystem.mjs` would fail typecheck and the runner's sync hook, so the spec
  rewrites the file, re-syncs, and restores the canonical spelling in a `finally`.
- Layer probes carry their own `data-layer`. A layer's
  `var(--colors-<x>)` resolves only under `[data-layer="<layer>"]`.
- The upstream emits name-based classes, `<system>__c_<token>` for colour and
  `<system>__bg-c_<token>` for background . The spec asserts the
  exact rule text the sync emits, so a renamed class fails loud, not silently.
- A layer-only token is a warning, not a failure. A consumer `css()` that names a
  token only a layers upstream defines makes sync warn `ATM-W-UNKNOWN-COLOR` at the
  call and emit the raw declaration, which the browser drops. Pinned by CORE-LAYERS-02.
- A system named in both `extends` and `layers` is rejected at load, with a named
  error: `extends` already includes everything `layers` gives, so the layers entry
  is removed rather than merged. Pinned by
  CORE-LAYERS-14, through a real `ref sync`. A name repeated within one field is
  rejected too (CORE-LAYERS-14); a repeat reached only through another system is not (see the diamond rule).
- An entry that reaches the config's own name, by its name or by any stream name,
  is rejected at load, so the own name never ranks as an upstream. This covers a
  self-named entry and an A to B cycle. Pinned by CORE-LAYERS-14.
- A layers entry with no streams is rejected at load. Only streams carry its CSS;
  without this check the entry would still become a sync qualifier and add nothing.
  Pinned by CORE-LAYERS-05 (the shape) and CORE-LAYERS-14 (a real sync).
- A system reached through two branches (a diamond) prints its block once, at its
  first position in the expansion, and the order statement lists it once. The published
  payload keeps the full expansion, so a consumer dedupes at print as well. Pinned by
  CORE-LAYERS-11, which keeps the statement and the paints unchanged.
- With upstreams, token scopes are disjoint. Each system declares its tokens on its own
  `[data-layer]` stamps, and own also on the document (`:root`, `body`). Own's bare
  `[data-color-mode=dark]` rule goes, so an upstream's layered root, which primitives stamp
  with `data-color-mode`, keeps the upstream's values. Standalone output is unchanged
  (`TokenScope::Isolated` in `system_layers/scope.rs`). Pinned by CORE-LAYERS-10, which reads
  the nested consumer child's own value in each colour-mode leg. Two limits are accepted: a
  plain non-primitive `<div data-color-mode>` island no longer switches own tokens under
  upstreams, so islands go through primitives' `colorMode`; and consumer plain content placed
  directly inside an upstream component, with no own primitive in between, inherits the
  upstream's values.
- `extendSystem` is the intentional theming path for a layered system, and tokens only in
  v1: recipes and globalCss are not overridden. Pinned by CORE-LAYERS-17 (an override paints under
  layers) and CORE-LAYERS-18 (its misuse, and the extends shape).

## Reference-rs cases and ownership

BAS-LAYER-01..04 (`packages/reference-rs/modules/base-system/SPEC.md:59-70`)
are not proven here. Their rule needs passing `base_system` unit tests, and that
module has no layers input yet (its README: "`layers` is not here yet", line 22).
Those stay separate Rust work.
Matrix `chain-t2` and `chain-t8` remain secondary proof for bundler and runtime
spread; these Core cases are the primary layers proof.

## Approved absences

| Absent | Reason |
| --- | --- |
| Layer fragments and tokens in the consumer spec | Extends-only (`packages/reference-core/src/collect/lib/evaluate.ts:63,110`); CORE-LAYERS-02 asserts the boundary. |
| Layer roster in `jsxElements` | Extends-only (`packages/reference-core/src/system/base/jsx.ts:112`); CORE-LAYERS-02. |
| Arbitration for a system in both lists (rejected at load) | Nothing to arbitrate: CORE-LAYERS-14 pins the named rejection. |
| Container root through layers | CORE-LAYERS-04. |
| Config validation messages | CORE-LAYERS-05 (shapes, precedence) and CORE-LAYERS-14 (relations, by real sync). |
| Re-sync after an upstream change | CORE-LAYERS-06. |
| A layer's reset, root default and `:root`-hoisted tokens in the served sheet | Portable, resetless, rootless blocks (`printUpstreamBlock`, `packages/reference-core/src/system/base/streams.ts:106-115`); CORE-LAYERS-08 asserts the boundary. |

## Out of scope

Panda's inner `layers.ts` spelling and the six-layer order (the LAYER group
owns those). Selector note: `agentcore run CORE-LAYER` is a prefix match and also
runs `CORE-LAYERS-*`; `agentcore run CORE-LAYER-` runs only the cascade-layer group.

## Claims pinned by CORE-LAYERS-08, -13 and -15

| Claim | Case |
| --- | --- |
| A layer's globalCss, `@font-face` and `@keyframes` print once in its block, carried below own (O1); an own rule on the same selector wins | CORE-LAYERS-08 |
| A layer's reset, root default and `:root`-hoisted tokens never reach the sheet; its tokens are empty at `:root` and resolve only under `[data-layer]` | CORE-LAYERS-08 |
| A layer's dark and breakpoint rules keep their layer rank: own's base colour beats them under the same condition | CORE-LAYERS-13 |
| Under one condition, own beats layers and layers beat extends | CORE-LAYERS-13 |
| A re-synced upstream drops its removed utility from the consumer's sheet and paint, with no stale CSS | CORE-LAYERS-15 |
| Watch mode re-syncs the consumer after a relative-path upstream rebuild | CORE-LAYERS-15 |
