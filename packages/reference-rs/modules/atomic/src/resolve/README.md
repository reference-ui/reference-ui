# Resolve

Turns a want into an **atom**: CSS value + conditions that belong on
that utility.

This pass is a 1:1 map of core's dialect utilities
(`packages/reference-core/src/system/panda/config/extensions/`).
Each utility owns its expand. Preset values are utterances
(`font()`, `tokens({ breakpoints })`, the lib theme). They do not
live in the compiler. There is no `patterns/` module — font owns
`font` / `weight` the way core's font subsystem does. `r/` owns the
container-query keys.

Order:

1. **macros** — `font` / `weight` / `container` / `size` / skip `variant`
2. **shorthands** — `borderBottom: 1px solid` → width/style longhands
3. **rhythm** — `2r` → calc / `--spacing-root`
4. **tokens** — `n300` → `var(--colors-…)`
5. **conditions** — `_hover` catalog and `&` application. Stored on
   the atom; stylesheet prints the wrap. Breakpoint keys go through `r/`.

`font/` looks up family and weight from `config/fonts.rs`. CSS
keyword fallback (`bold` → `700`) is language. `-0.01em` tracking
is a `font('sans', { css: { letterSpacing } })` fragment.

`r/` looks up widths from `config/breakpoints.rs`. Numeric keys are
language. `sm` → 640px is a CSS-generic default, not a baked lib theme.

`conditions` is the `when` list. Pseudo-props are the `_` catalog
JSX can spell. Pseudo-selectors apply `&` templates to the utility
class. Extract is one object walk; JSX only spells `_` as an
identifier. `@media` / `@container` pass through. `r/` already
stamped those onto `when`.

Still to fold into the same convention: `container/` and `size/` as
the same small-folder convention. `tokens/` stays until a real
base-system color table exists; it must not become a second property
table next to canon.

Does not print the stylesheet. `stylesheet/name` spells the class from
the atom. Resolve runs here so the sheet and `css()` cannot disagree.
