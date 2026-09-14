# Resolve

Turns a want into an **atom**: CSS value + conditions that belong on
that utility.

One longhand (or a shorthand that does not lie) → one class. Tokens and
rhythm become CSS values. Conditions become part of the atom key and a
selector. Shorthands expand so `border-color` can exist as its own
utility without `currentColor` winning (`STYLE_ERRORS_REPORT.md`).

Order:

1. **rhythm** — `r` → calc / `--spacing-root`
2. **tokens** — `n300` → `var(--colors-…)`
3. **shorthands** — `borderBottom: 1px solid` → width/style longhands,
   not a `border-bottom` shorthand that resets color
4. **conditions** — `_hover` → atom.when + `&:hover`

Does not print the stylesheet. `stylesheet/name` spells the class from
the atom, not from a hashed object.

## Files (when coded)

- `mod.rs` — `resolve(want, config) -> Atom`
- `shorthands/`, `rhythm/`, `tokens/`, `conditions/`

## Panda

`vendor/panda/crates/pandacss_utility` — `transform`, `normalize.rs`
(`StyleNormalizer`), `runtime_class.rs`. Their hole: executable
transforms stayed host JS callbacks. Ours run here so the sheet and
`css()` cannot disagree.

Rhythm is ours (`reference-core` `extensions/rhythm`), not a Panda
primitive. Token vars: `pandacss_tokens` + our `tokens()` dictionary.
