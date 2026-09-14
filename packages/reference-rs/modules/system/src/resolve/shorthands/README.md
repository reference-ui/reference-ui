# Resolve / shorthands

Atomic grain means `borderBottom` and `borderColor` are **two utilities**.
That is the mapping we need. It is also the Book white-border bug:

`.bd-b_1px_solid` sets `border-bottom: 1px solid` (color → `currentColor`)
and races `.bd-c_gray.800`.

Do not “fix” that by hashing both props into one class. Runtime `css()`
must still look up each leaf.

Fix, part one: expand the shorthand to longhands that **do not reset color**
(`border-bottom-width`, `border-bottom-style`), same as the intent of
`createShorthandUtility` in core. Authors still write
`borderBottom="1px solid" borderColor="gray.800"`.

Fix, part two — expansion is **not sufficient on its own**. `borderColor` is
itself a shorthand of four longhands, so `.bd-c_*` and `.bd-b-c_*` are two
utilities that still need ordering. `stylesheet` sorts by property priority
(`shorthands-of-shorthands → shorthands → logical longhands → physical
longhands`) so the longhand always wins. Both halves are required; see
`../../stylesheet/README.md`.

The factory is the *behavior spec* (0 / none / var() / token
classification). Port the parser. Emit atoms the namer and `css()` share.

## Files (when coded)

- `mod.rs` — shorthand want → longhand atom(s)
- `border.rs`, `outline.rs`, `parser.rs`

## Panda

`pandacss_utility/src/normalize.rs` plus our core
`createShorthandUtility` (the behavior spec). Panda v2 could not run
that factory from Rust — that is the Tabs ghost class. Port the parser
into this module.

## Must not

- Emit `border-bottom: 1px solid` as a utility that clobbers color.
- Expand in JS for runtime and in Rust for build.
- Collapse sibling shorthands into a hashed rule.
