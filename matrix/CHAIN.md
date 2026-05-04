# CHAIN — topology sketches

`extends` and `layers` are different compiler modes.

- `extends` pulls an upstream `fragment` into config generation. Tokens, keyframes, fonts, global CSS, JSX elements, and TypeScript surface flow into the consumer.
- `layers` pulls only upstream `css` into final stylesheet assembly. Components render under the upstream `@layer <name>` / `[data-layer="<name>"]` scope, but upstream tokens do not enter the consumer's Panda config or TypeScript surface.
- One compilation boundary is bucketed, not fully interleaved: a consumer declares `extends[]` and `layers[]`. Mixed sketches below are graph shapes, not arbitrary per-entry sequences. At assembly time, upstream CSS is collected as `extends` first, then `layers`, then the local system layer.
- Every sketch runs left to right. `User space` means the package currently being compiled at that boundary.

---

## Core compiler-proof set

### T1: Extend one library

Compiler question: does one upstream system contribute fragment + tokens/types + portable CSS?

```
  Library A ──▶ extend ──▶ User space
```

---

### T2: Layer one library

Compiler question: does one upstream system contribute portable CSS only, with no token/type adoption?

```
  Library A ──▶ layer  ──▶ User space
```

---

### T3: Extend one library + layer another (hybrid)

Compiler question: can one boundary use both composition modes at once?

```
  Library A ──▶ extend ──┐
                         ├──▶ User space
  Library B ──▶ layer  ──┘
```

---

### T4: Extend several libraries (parallel extends)

Compiler question: does the `extends[]` bucket preserve declared order across multiple upstream systems?

```
  Library A ──▶ extend ──┐
  Library B ──▶ extend ──┼──▶ User space
  Library C ──▶ extend ──┘
```

---

### T5: Layer several libraries (parallel layers)

Compiler question: does the `layers[]` bucket preserve declared order across multiple portable stylesheets?

```
  Library A ──▶ layer  ──┐
  Library B ──▶ layer  ──┼──▶ User space
  Library C ──▶ layer  ──┘
```

---

### T6: Chain (app extends only B; B already extends A)

Compiler question: does a published outer system flatten its upstream state so the app can depend on the outer package only?

```
  Library A ──▶ extend ──▶ Library B ──▶ extend ──▶ User space
```

---

### T7: Diamond (app extends two libraries that both extend the same base)

Compiler question: does the compiler handle a shared-base graph rather than assuming one linear upstream?

```
  Library A ──▶ extend ──▶ Library B ──▶ extend ──┐
            └─▶ extend ──▶ Library C ──▶ extend ──┴──▶ User space
```

---

### T8: Same library extended and layered

Compiler question: what is the policy when the same upstream appears in both buckets: allow, dedupe, or reject?

```
  Library A ──▶ extend ──┐
                         ├──▶ User space
  Library A ──▶ layer  ──┘
```

---

### T9: Several extends + several layers (full mix)

Compiler question: does final assembly preserve the real config model: `extends...`, then `layers...`, then the local system layer?

```
  Library A ──▶ extend ──┐
  Library B ──▶ extend ──┤
  Library C ──▶ layer  ──┼──▶ User space
  Library D ──▶ layer  ──┘
```

---

### T10: Chain + layer at the app

Compiler question: can transitive extend composition and app-level layering coexist without leaking layered tokens into user space?

```
  Library A ──▶ extend ──▶ Library B ──▶ extend ──┐
                                                   ├──▶ User space
  Library W ──▶ layer  ────────────────────────────┘
```

---

### T11: Parallel chains (two independent extend-chains into the app)

Compiler question: does the compiler handle multiple transitive upstream paths at the same boundary?

```
  Library A1 ──▶ extend ──▶ Library B1 ──▶ extend ──┐
                                                     ├──▶ User space
  Library A2 ──▶ extend ──▶ Library B2 ──▶ extend ──┘
```

---

### T12: Diamond base, mixed branch composition (layer vs extend into user space)

Shared base `A`; both `B` and `C` are built against `A`; the app adopts `B` via `layer` and `C` via `extend`.

Compiler question: can sibling branches built against the same base be adopted in different modes at the app boundary?

```
  Library A ──▶ extend ──▶ Library B ──▶ layer  ──┐
            └─▶ extend ──▶ Library C ──▶ extend ──┴──▶ User space
```

---

### T13: Parallel chains + shared layer

Compiler question: does the compiler compose multiple transitive upstreams plus an app-layered library in the same build?

```
  Library A1 ──▶ extend ──▶ Library B1 ──▶ extend ──┐
  Library A2 ──▶ extend ──▶ Library B2 ──▶ extend ──┼──▶ User space
  Library W  ──▶ layer  ─────────────────────────────┘
```

---

## Derived / reduced sketches

These are useful naming shortcuts, but they are not separate heavy-fixture requirements once the core proof set is green.

### T14: One extend + several layers

Coverage note: reduced form of T9.

```
  Library A ──▶ extend ──┐
  Library B ──▶ layer  ──┼──▶ User space
  Library C ──▶ layer  ──┘
```

---

### T15: Several extends + one layer

Coverage note: reduced form of T9.

```
  Library A ──▶ extend ──┐
  Library B ──▶ extend ──┼──▶ User space
  Library C ──▶ layer  ──┘
```

---

### T16: Diamond + one layered library

Coverage note: composition of T7 plus an extra T2-style layer input. Good as a follow-up, not a first proof.

```
  Library A ──▶ extend ──▶ Library B ──▶ extend ──┐
            └─▶ extend ──▶ Library C ──▶ extend ──┼──▶ User space
  Library D ──▶ layer  ────────────────────────────┘
```

---

### T17: Chain beside another extend + layer

Coverage note: composition of T6 plus T3/T10. Treat as a superset scenario.

```
  Library A ──▶ extend ──▶ Library B ──▶ extend ──┐
  Library C ──▶ extend ────────────────────────────┼──▶ User space
  Library W ──▶ layer  ────────────────────────────┘
```

---

### T18: Extend, layer, extend (three different libraries)

Coverage note: graph shape only. At one config boundary this is still represented as `extends: [A, C]` and `layers: [B]`, so T9 owns the real ordering guarantee.

```
  Library A ──▶ extend ──┐
  Library B ──▶ layer  ──┼──▶ User space
  Library C ──▶ extend ──┘
```

---

## Tests (enough to claim "chainable compiler")

**Ground truth from the implementation**

1. `extends` and `layers` are config-driven, separate buckets on `ui.config.ts`.
2. `extends` contributes upstream fragment data into config generation and downstream system publication.
3. `layers` contributes upstream portable CSS only during final stylesheet assembly.
4. Final assembly currently collects upstream CSS as `extends` first, then `layers`, before the local system layer declaration.
5. Layer identity comes from `ui.config.name` and is expressed through both `@layer <name>` and `[data-layer="<name>"]`.

**Unit / narrow integration should own**

1. `collectUpstreamSystems()` bucketed ordering: declared `extends[]` order, declared `layers[]` order, and `extends` before `layers`.
2. `postprocessCss()` assembled stylesheet shape: local portable stylesheet plus upstream CSS, with the correct `@layer` prelude.
3. `createPortableStylesheetFromContent()` token extraction and `[data-layer]` scoping.
4. The explicit T8 policy: either reject, dedupe, or document the allowed duplicate semantics.

**Heavy fixture / browser tests should own**

1. T1 / T2 sanity: extend adopts tokens/types; layer does not.
2. T3 hybrid: both modes at one boundary.
3. T6 chain: transitive extend through a published outer library.
4. T9 full mix: real bucketed multi-input assembly.
5. T10 chain + layer: transitive extend plus layered CSS in the same app.
6. T11 parallel chains: multiple transitive upstream paths at once.
7. T12 diamond mixed: shared base with asymmetric app adoption modes.
8. T13 parallel chains + shared layer: composition of the hardest chain cases.
9. DOM/runtime checks where needed: `data-layer`, token visibility, and actual component rendering.

**Claim bar**

We can reasonably say "we have a chainable design system compiler" once all of the following are true:

1. Single-hop `extend` and `layer` semantics are proven.
2. Bucketed multi-input ordering is proven in unit tests.
3. Transitive chain composition is proven in real fixtures.
4. Shared-base / diamond graphs are proven.
5. Mixed-mode graphs (`extend` + `layer`) are proven.
6. `data-layer` scoping and non-adoption of layered tokens are proven in browser/runtime checks.
7. The T8 same-package-in-both-buckets policy is explicit.

**Suggested execution order**

1. T3
2. T6
3. T9
4. T10
5. T11
6. T12
7. T13
8. T7
9. T8

**Stop rule**

If a new candidate test fails for the same underlying bug an existing postprocess or core-topology test would already catch, merge the scenario instead of growing the matrix.
