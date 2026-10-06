# BUG REPORT — `{token}` refs embedded in a composite token value emit verbatim

- **Filed:** 2026-10-06 (agent-docs session, while wiring docs control surfaces to the gray ramp)
- **Status:** open — deferred to a later cycle
- **Severity:** medium — silent invalid CSS, no diagnostic; low blast radius today, latent system-wide
- **Area:** `packages/reference-rs` (base-system lowering + atomic tokens-layer emission)

## Summary

A plain `tokens()` value that is a **composite string containing a `{path.to.token}` reference**
is emitted into `@layer tokens` **verbatim**, braces and all, producing invalid CSS that the
browser silently drops. Only a value that is *exactly* one brace reference is converted to
`var(--…)`. Reference expansion inside composite strings works on the utility/recipe path, so
the gap is easy to hit and surprising.

## Impact

- **Silent:** no build error, no diagnostic. The declaration is invalid and the browser discards
  it; the surface falls back to transparent/inherited.
- **Latent system-wide:** any consumer token authored as
  `color-mix(in oklch, {colors.x} N%, transparent)` breaks, in any app.
- **Not currently triggered by the shipped library** — 0 embedded-ref token values across the six
  lib token files — so it is latent for `@reference-ui/lib` and active for app-authored tokens
  (the docs hit it first).

## Reproduction

`packages/reference-docs/src/docs-theme.fragments.ts` (original, before the workaround):

```ts
docsControlBg: {
  value: 'rgba(255, 255, 255, 0.72)',
  dark: 'color-mix(in oklch, {colors.gray.900} 72%, transparent)',
},
```

Emitted tokens layer:

```css
--colors-docs-control-bg: color-mix(in oklch, {colors.gray.900} 72%, transparent);
```

`{colors.gray.900}` is not a valid CSS color, so the whole declaration is invalid and the
control surface loses its fill.

By contrast, the **whole-value** form works:

```ts
dark: '{colors.gray.900}'   /* emits: var(--colors-gray-900) */
```

…and the **same composite pattern expands correctly on the utility/recipe path**, e.g.
`packages/reference-lib/src/core/theme/primitives/tables.ts` emits
`color-mix(in oklch, var(--colors-ui-table-footer-muted-background) 50%, transparent)`.

## Root cause

`packages/reference-rs/modules/atomic/src/stylesheet/system_layers/mod.rs`

- `css_token_value()` (line 318) calls `brace_path()` (line 348), which returns `Some` **only when
  the trimmed value starts with `{` and ends with `}`** — i.e. the entire value is a single
  reference.
- Any other value falls through to `resolve_rhythm()` and is returned as-is (line 334). Embedded
  `{…}` refs are never substituted and no diagnostic is raised.
- Lowering (`packages/reference-rs/modules/base-system/src/lower/mod.rs`) stores leaf values raw;
  `alias_target()` there (line 239) is whole-value-only and used solely for cycle detection, not
  substitution. So emission is the only place whole-value refs are converted, and it does not
  handle composites.

## Suggested fix

1. In `css_token_value`, scan the **whole value** for `{path}` occurrences and rewrite each
   resolvable one to `var(--…)` via the same `system.token(inner)` lookup — instead of only the
   whole-value case. Keep the rhythm-root self-reference guard.
2. Reuse / mirror the reference scan from the utility resolver
   (`packages/reference-rs/modules/atomic/src/resolve/tokens/interpolate.rs`) so the tokens layer
   and the utility layer behave identically.
3. Emit a **diagnostic** when a `{…}` reference survives unresolved, so this can never silently
   produce invalid CSS again.
4. Add a regression station (e.g. `ATM-TOKEN-*`) pinning a composite
   `color-mix(… {colors.x} …)` token value and its emitted `var(--…)` form.

## Workaround (currently in use)

Author plain token values with the CSS var directly:

```ts
dark: 'color-mix(in oklch, var(--colors-gray-900) 72%, transparent)',
```

The docs control surfaces (`docsControlBg`, `docsControlBorder`, `docsScrim`) were switched to this
form on 2026-10-06.

## References

- `packages/reference-rs/modules/atomic/src/stylesheet/system_layers/mod.rs:313-354` — `css_token_value` / `brace_path`
- `packages/reference-rs/modules/base-system/src/lower/mod.rs:239-248` — `alias_target` (whole-value only)
- `packages/reference-rs/modules/atomic/src/resolve/tokens/interpolate.rs` — utility-path ref expansion
- `packages/reference-docs/src/docs-theme.fragments.ts` — discovery site
