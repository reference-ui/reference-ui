# CSS Fragment Composition

## Summary

`css()` should work as a first-class static fragment collector and composition primitive — not just
a typed style-object helper. This means passing multiple style objects or previously-built `css()`
results into a single `css()` call should produce a deeply merged, deduplicated output, with no
need for `.raw()` or any explicit merge utility.

The Rust-powered AST layer is what makes this reliable. Deep merging across nested conditions
(pseudo-selectors, `_rtl`, `_checked`, responsive variants, etc.) is handled statically at
transform time, not at runtime.

## Motivation

Today, composing styles requires either:

- manual spread operators that flatten nested conditions incorrectly
- `.raw()` calls that bypass the type contract
- external merge utilities that are not AST-aware and produce duplicate CSS

None of these options feel like a real composition primitive. They are workarounds.

`css()` is already the authoring surface. It should also be the composition surface.

## Design

`css()` accepts a variadic list of style objects and/or previously-built fragment references.
Fragments are merged left-to-right. Conflicting keys are resolved in favor of the rightmost
argument. Nested condition blocks are deep-merged rather than replaced:

```ts
const base = css({
    translate: 'auto',
    size: 'size',
    _checked: { translateX: 'size' },
})

const variant = css(base, {
    sizing: '5',
    _rtl: { translateX: '-size' },
})
```

`variant` above is equivalent to the fully-merged object:

```ts
css({
    translate: 'auto',
    size: 'size',
    sizing: '5',
    _checked: { translateX: 'size' },
    _rtl: { translateX: '-size' },
})
```

No runtime merging. No duplicate atomic classes. The output is resolved once, statically.

## Key Properties

- **No `.raw()` required.** A `css()` call used as a fragment argument is already in the right
  shape. It does not need to be unwrapped first.
- **Deep merge, not shallow.** Nested condition objects (`_checked`, `_rtl`, `_hover`, `@layer`,
  `@container`, etc.) are recursively merged rather than replaced.
- **No duplicate CSS.** Because merging happens before Panda sees the output, each property
  appears exactly once in the final atomic stylesheet.
- **Type-safe with `strictTokens`.** The merged result inherits the full type contract. Fragments
  composed from strict-token-constrained calls remain strictly typed end to end.

## Relationship to Recipes

This is the lightweight composition layer that sits _under_ recipes.

Recipes are the higher-level surface for variant-driven components. `css()` composition is for
cases where variants are not needed — shared base styles, utility layers, and ad-hoc combinations
that should not carry a full recipe contract.

Practically: a recipe's `base` and each `variants` entry can themselves be authored as named
`css()` fragments, making the recipe body easier to read and refactor without changing its
generated output.

## Implementation Notes

- The merge logic belongs in the Rust transform layer, not in TypeScript runtime code.
- The AST analysis needs to reliably detect when a `css()` argument is itself a `css()` call or
  a reference to one, so it can flatten and re-merge rather than pass an opaque expression to
  Panda.
- This connects directly to the coercion strategy in `CSS_FRAGMENTS.md` at the repo root: the
  merged result is what should be materialized into the Panda-visible virtual tree, not the
  original multi-argument call.
- The target implementation site is the same virtual transform infrastructure used by `r`:
  `packages/reference-rs/src/virtualrs/`
