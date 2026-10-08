# Font weight: family-scoped miss (`mono.black`)

**Status:** open — edge case vs bug not settled
**Area:** reference-rs atomic resolver + reference-neo runtime/static scope
**Found:** Typography weight ramp on `/typography`

## Observed

`font="mono" weight="black"` renders at `font-weight: 400` — the family
default — even though the `black` CSS keyword is 900. `serif` (whose scale
declares `black`) and bare `weight="black"` are unaffected.

## Evidence

`ref sync` compiles the pair to this class and rule:

```css
.reference-docs__font-weight_mono\.black { font-weight: mono.black; }
```

`mono.black` is not a valid `font-weight` value, so the browser drops the
declaration and the element keeps the family's `css.fontWeight` (`normal` →
400). `getComputedStyle(el).fontWeight === '400'`.

## Mechanism

1. `font="mono"` + `weight="black"` scopes to the name `mono.black`
   (`packages/reference-neo/src/runtime/css/scope.ts`;
   static twin `packages/reference-rs/modules/atomic/src/resolve/font/scope.rs`).
2. `lower_weight` (`packages/reference-rs/modules/atomic/src/resolve/font/weight.rs`)
   calls `FontScale::scoped_weight("mono.black")`. Mono's `weights` map
   (`packages/reference-lib/src/core/theme/fonts.ts`) has no `black`, so it
   returns `None`.
3. `css_weight_keyword("mono.black")` also returns `None` — the value is not one
   of the six bare names.
4. `lower_weight` falls through to `unwrap_or(raw)` and emits the literal
   `mono.black`.

## Why it may be browser behavior, not a bug

Dropping an invalid declaration and falling back to the inherited/default value
is standard CSS. The questionable part is the system *constructing* the scoped
name for a weight the family never declared instead of resolving the keyword.

## Contract mismatch (if it is treated as a bug)

`packages/reference-docs/src/content/docs/system/fonts.mdx` says: "Only the names
you list exist for this family — anything else falls back to the CSS keywords."
That predicts `black` → 900 (then clamped to the axis ceiling), not 400.

## Options

- **Resolver fix** (`lower_weight`): when a dotted name misses the scale, retry
  the suffix as a keyword (`mono.black` → `black` → 900). One place, covers
  static and runtime.
- **Scope fix** (`scope.ts` / `scope.rs`): only scope a keyword to
  `family.name` when that family declares it.
- **Accept as an edge**: document that a weight a family does not define is a
  no-op that renders the family default.

## Repro

Use `font="mono" weight="black"` in any reference-docs slice, then inspect the
generated rule or the computed `font-weight`. Compare against
`font="serif" weight="black"` (resolves 900) and bare `weight="black"` (900).
