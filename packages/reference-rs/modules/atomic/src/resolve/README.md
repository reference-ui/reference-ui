# Resolve

Turns a want into an **atom**: CSS value + conditions that belong on
that utility.

This pass is a 1:1 map of the canon dialect extensions.
Each utility owns its expand. Preset values are utterances
(`font()`, `tokens({ breakpoints })`, the lib theme). They do not
live in the compiler. There is no `patterns` module — font owns
`font` / `weight` the way core's font subsystem does. `r` owns the
container-query keys.

Order:

1. **macros** — `font` / `weight` / `container` / `size` / skip `variant`
2. **shorthands** — `borderBottom: 1px solid` → width/style longhands
3. **rhythm** — `2r` → calc / `--spacing-root`
4. **tokens** — `n300` → `var(--colors-…)`
5. **conditions** — `_hover` catalog and `&` application. Stored on
   the atom; stylesheet prints the wrap. Breakpoint keys go through `r`.

`font` looks up family and weight from the ingested system fonts
(`FontScale`, base-system crate). CSS keyword fallback (`bold` → `700`)
is language. `-0.01em` tracking is a
`font('sans', { css: { letterSpacing } })` fragment.

`r` looks up widths from the ingested breakpoint scale
(`BreakpointScale`, base-system crate). Numeric keys are language. `sm`
→ 640px is a CSS-generic default, not a baked lib theme.

`conditions` is the `when` list. Pseudo-props are the `_` catalog
JSX can spell. Pseudo-selectors apply `&` templates to the utility
class. Extract is one object walk; JSX only spells `_` as an
identifier. `@media` / `@container` pass through. `r` already
stamped those onto `when`.

`container` and `size` are single modules, not folders. `tokens`
looks up the base-system token table; it must not become a second
property table next to canon.

Does not print the stylesheet. `stylesheet::name` spells the class from
the atom. Resolve runs here so the sheet and `css()` cannot disagree.

Up: atomic.
