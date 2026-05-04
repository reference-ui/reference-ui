# CHAIN RULES — composition contract

This document is the semantic companion to `CHAIN.md`.

`CHAIN.md` names the graph shapes we want to test.
This file defines what those shapes are supposed to mean at the compiler boundary.

The goal is to be precise enough that, once the priority topologies are green, we can honestly say Reference UI behaves like a chainable design-system compiler.

---

## Core model

Every published library exposes a `baseSystem` boundary object.

In practice that boundary is made from four distinct surfaces:

- `name`: the design-system identity from `ui.config.name`
- `fragment`: the portable config-time fragment bundle used by `extends`
- `css`: the portable layer-safe stylesheet used by `layers` and other downstream CSS consumers
- `jsxElements`: extra JSX element metadata used for discovery

The important rule is simple:

- `extends` consumes the published `fragment` surface
- `layers` consumes the published `css` surface

Those surfaces are related, but they are not the same thing.

---

## Hard rules today

1. `ui.config.name` is required and is the system identity for both `@layer <name>` and `[data-layer="<name>"]`.
2. `extends[]` participates in config generation. Upstream fragment data becomes part of the consumer's Panda config and TypeScript surface.
3. `layers[]` does not participate in config generation. It contributes only portable CSS during final stylesheet assembly.
4. At one compilation boundary, composition is bucketed as `extends[]` and `layers[]`. There is no truly interleaved per-entry execution model.
5. Upstream CSS assembly currently uses the bucket order `[...extends, ...layers]` for upstream layer ordering.
6. The consumer's local system layer is always part of the final stylesheet and is ordered after upstream layers in the top-level `@layer` prelude.
7. A published library may republish transitive styles through its own `baseSystem.css`, because that field is written from postprocessed output, not just raw local CSS.

---

## What crosses the boundary

| Consumer config | Published fragment imported? | Published CSS imported? | Upstream tokens/types visible in consumer? | Result |
| --- | --- | --- | --- | --- |
| `extends: [LibA]` | Yes | Yes, if `LibA` published `css` | Yes | Full adoption of `LibA`'s published config surface plus its published styles |
| `layers: [LibA]` | No | Yes | No | Visual adoption only |
| `extends: [LibA], layers: [LibB]` | `LibA` only | `LibA` + `LibB` | `LibA` only | Mixed boundary: one adopted system, one visual-only system |
| `extends: [Meta]` where `Meta` extends `Core` | Yes, through `Meta.fragment` | Yes, through `Meta.css` | Yes, for whatever `Meta.fragment` republishes | Transitive extend through the published outer package |
| `layers: [Meta]` where `Meta` extends `Core` | No | Yes, through `Meta.css` | No | Styles can travel transitively even when tokens do not |
| `extends: [Meta]` where `Meta` layers `Utility` | Yes, for `Meta.fragment` only | Yes, through `Meta.css` | No `Utility` token adoption unless `Meta` also extends it | Layered styles can travel through an extended package |

The key distinction is:

- fragment transitivity is owned by `baseSystem.fragment`
- style transitivity is owned by `baseSystem.css`

That is why `extend` and `layer` can both carry styles transitively, while only `extend` carries config and type surfaces.

---

## Transitive composition rules

### 1. Extending a library means adopting what that library published

If `App` extends `Meta`, the app does not reason about `Meta`'s internal source files directly.
It consumes the already-published `Meta.baseSystem` surfaces.

That means the app gets:

- whatever fragment state `Meta` published
- whatever portable CSS `Meta` published

If `Meta` itself already extended or layered other systems, those effects may already be baked into the published artifact.

### 2. Layering a library means importing its published CSS only

If `App` layers `Meta`, the app gets only `Meta.css`.

The app does not get:

- `Meta` tokens in Panda config
- `Meta` token names in generated TS types
- `Meta` fragment-driven config extensions

But the app can still get transitive styles if `Meta.css` already contains them.

### 3. Chains are artifact chains, not source-file chains

When we say the compiler is "chainable", the real statement is:

- a package can publish a `baseSystem`
- another package can consume that `baseSystem`
- the resulting package can publish a new `baseSystem`
- downstream consumers can continue composing from there

This is why T6, T10, T11, T12, and T13 matter so much.

---

## Ordering and precedence rules

There are two different ordering stories: config merge order and stylesheet assembly order.

### Config merge order

For config-time fragment data:

1. upstream `extends[]` fragments are evaluated in declared array order
2. local fragments are evaluated after upstream fragments
3. later fragment contributions override earlier ones on the same paths

Practical consequence:

- for repeated token paths across multiple `extends[]`, later entries win
- for repeated token paths between upstream and local, local wins

Reference UI's Panda extension layer deep-merges fragment contributions, but the effective conflict rule is still "later writer wins on the same leaf path".

### Stylesheet assembly order

For final CSS assembly:

1. upstream CSS is collected as `extends[]` first, then `layers[]`
2. the top-level `@layer` prelude is ordered as `upstream..., local-system`
3. the local portable stylesheet is emitted into the assembled file alongside appended upstream CSS

Important nuance:

- file order and layer precedence are not the same thing
- the compiler uses the top-level `@layer ...;` prelude to declare cascade order
- the actual upstream bucket order comes from `collectUpstreamSystems(config)`

So a sketch like `extend -> layer -> extend` at one boundary is not a real execution order. At the config surface it reduces to:

```ts
extends: [A, C]
layers: [B]
```

and the upstream CSS ordering contract becomes `A`, `C`, then `B`, followed by the local system layer in the prelude.

---

## What must stay true about layers

1. Layered tokens must not leak into the consumer's Panda theme.
2. Layered tokens must not appear in the consumer's generated TS token surface.
3. Upstream layer identity must remain tied to the upstream package's `ui.config.name`.
4. Primitives must emit `data-layer="<consumer-name>"` for the current project automatically.
5. Upstream portable CSS must remain self-contained enough to be appended without re-running upstream config generation.

This is the core contract behind T2, T3, T10, T12, and T13.

---

## Shared-base and diamond rules

Diamond graphs need special care because there are two different questions:

1. Can the compiler compose two branches that share the same base?
2. Does the compiler deduplicate the shared-base contribution automatically?

Those are not the same guarantee.

### What the current model guarantees

- each branch publishes its own `baseSystem`
- downstream consumers can compose those published branch artifacts
- the compiler does not currently define a general graph-aware dedupe contract for shared-base contributions

So for diamond shapes, the safe current wording is:

- composition is the goal
- automatic deduplication is not yet a guaranteed rule

That means T7 and T12 are high-value tests precisely because they force us to decide whether duplicate shared-base CSS or duplicate shared-base fragment contribution is acceptable, normalized, or rejected.

---

## Current non-contracts / policy still needed

These cases should be called out explicitly instead of being hand-waved.

### Same library in both buckets

Case:

```ts
extends: [LibA]
layers: [LibA]
```

Current situation:

- validation does not reject it
- upstream CSS collection does not dedupe it
- this can duplicate CSS contribution or create confusing layer-order behavior

Recommended policy:

1. reject it explicitly, or
2. dedupe it explicitly, or
3. document the exact semantics and test them

Until then, treat T8 as unresolved policy, not settled compiler behavior.

### Duplicate `ui.config.name` across libraries

Case:

- two different packages publish the same layer name

Risk:

- `@layer` collision
- `[data-layer]` collision
- unclear DOM scoping behavior

Recommended policy:

- require unique names across a composed graph
- ideally validate this during config or sync

### Diamond dedupe

Case:

- `B` and `C` both build on `A`
- app composes `B` and `C`

Recommended policy question:

- do we accept duplicate shared-base contribution as part of branch-local publication?
- or do we want graph-aware canonicalization?

This should be decided intentionally, not inferred accidentally from current implementation.

---

## Recommended rule set to lock down

If we want a clean v1 contract, the most defensible rules are:

1. `extends` means config adoption plus style adoption from the published artifact.
2. `layers` means style adoption only from the published artifact.
3. Upstream bucket order is fixed: `extends[]`, then `layers[]`, then local.
4. Local fragment contributions override upstream fragment contributions on the same leaf paths.
5. Every package in a composed graph must have a unique `ui.config.name`.
6. Same-package-in-both-buckets should be rejected unless we deliberately support it.
7. Diamond composition must be supported; diamond dedupe must be either specified or declared out of scope.

If we lock down those seven rules and then prove the priority topologies from `CHAIN.md`, the compiler story becomes coherent instead of accidental.

---

## Mapping back to topology tests

- T3 proves the two-bucket boundary contract.
- T6 proves transitive extend through a published outer package.
- T9 proves bucket ordering and mixed assembly.
- T10 proves extend-chain plus app-layer coexistence.
- T11 proves multiple transitive paths at one boundary.
- T12 proves asymmetric sibling adoption modes on a shared base.
- T13 proves the hardest mixed composition story.
- T8 forces a policy decision instead of hiding it.

---

## Bottom line

Reference UI should be described as a chainable compiler only if all three statements are true:

1. published `baseSystem` artifacts can be consumed repeatedly across package boundaries
2. `extends` and `layers` remain semantically distinct at every boundary
3. ordering, precedence, and shared-base behavior are explicit rather than accidental

That is the bar this rules document is trying to define.