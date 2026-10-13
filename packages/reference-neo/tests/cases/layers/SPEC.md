# LAYERS — visual-only upstream systems

This group proves the `layers` contract in Neo's own loop. A `layers` entry is
a real published base system, and only its `streams` join the cascade: no
fragments, no roster, no types. Every case syncs its upstreams for real because
a stand-in has no `streams`, so computed style and the served sheet are the
oracle, with sheet text pinned beside the paint and never alone.

## Dialect

Authors write `layers: [system]` beside `extends` in `ui.config.ts`. Each entry
is the `BaseSystem` a package's `baseSystem.mjs` carries (`name`, `fragment`,
`streams`; `src/system/base/types.ts:28-37`). The merge runs in bucket order,
extends then layers, with the own entry last
(`src/sync/index.ts:219-223`, `src/system/base/streams.ts:185-214`):

    @layer <extends names>, <layers names>, <own>;
    <extends blocks> <layers blocks> <own block>

Each upstream block is reprinted portable, resetless and rootless
(`printUpstreamBlock`, `streams.ts:106-115`), so its tokens sit under
`[data-layer="<name>"]`. Upstream names feed the compile request as qualifiers,
extends then layers (`sync/index.ts:161-169`). Validation requires synced data
on every entry (`src/config/validate.ts:106-107`,
`src/system/base/validate.ts:76-94`).

## Decisions

- D1 Real sync, never stand-ins. Each case syncs its upstream through the real
  `sync()`, the NEO-CHAIN-06 pattern, then extends the consumer config mid-run.
- D2 The committed `ui.config.ts` imports nothing. An import of an unsynced
  `baseSystem.mjs` would fail typecheck and the runner's sync hook, so the spec
  rewrites the file, re-syncs, and restores the canonical spelling in a `finally`.
- D3 Layer probes carry their own `data-layer`. A layer's
  `var(--colors-<x>)` resolves only under `[data-layer="<layer>"]`.
- D4 The upstream emits name-based classes, `<system>__c_<token>` for colour and
  `<system>__bg-c_<token>` for background (observed here). The spec asserts the
  exact rule text the sync emits, so a renamed class fails loud, not silently.

## Engine stations and ownership

BAS-LAYER-01..04 (`packages/reference-rs/modules/base-system/SPEC.md:189-200`)
are not proven here. Their rule needs passing `base_system` unit tests, and that
module has no layers input yet (its README: "`layers` is not here yet", line 22).
Those stay separate Rust work.
Matrix `chain-t2` and `chain-t8` remain secondary proof for bundler and runtime
spread; these Neo cases are the primary layers proof.

## Approved absences

| Absent | Reason |
| --- | --- |
| Layer fragments and tokens in the consumer spec | Extends-only (`evaluate.ts:133,164`); NEO-LAYERS-02 asserts the boundary. |
| Layer roster in `jsxElements` | Extends-only (`jsx.ts:71`); NEO-LAYERS-02. |
| Dedupe and self-exclusion arbitration | NEO-LAYERS-03. |
| Container root through layers | NEO-LAYERS-04. |
| Config validation messages | NEO-LAYERS-05. |
| Re-sync after an upstream change | NEO-LAYERS-06. |

## Out of scope

Panda's inner `layers.ts` spelling and the six-layer order (the LAYER group
owns those). `styled/global.css` contents for layers (no layer authors global
CSS here). Selector note: `agentneo run NEO-LAYER` is a prefix match and also
runs `NEO-LAYERS-*`; `agentneo run NEO-LAYER-` runs only the cascade-layer group.
