# Stylesheet / name

`(atom) → class name`

Identity is `(prop, value, when)`. Same leaf, same class, in the sheet
and in `src/runtime`. Disagreement is a ghost class.

Spelling can be ours (`mt_2r`). It does not have to photocopy Panda
`bd-b_3px_solid`. It must be a pure function of the leaf so lib + app
concat the same utility.

## Files (when coded)

- `mod.rs` — `class_name(atom) -> String`
- `escape.rs` — CSS identifier hygiene

## Panda

- `vendor/panda/crates/pandacss_utility/src/lib.rs` — `format_class_name`,
  separator / prefix / hash
- `src/runtime_class.rs` — `runtime_class_name_for_atom` (the anti-split-brain
  function; **this idea is load-bearing**)
- `pandacss_shared` — `hyphenate_property`, `without_space`, `css_escape`

## Must not

- Name a class from a hashed StyleProp object.
- Own `Want` / `Atom` (`atom/`).
- A second namer in JS.
