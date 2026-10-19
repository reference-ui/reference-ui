# Stylesheet / name

`(atom) → class name`

Identity is `(prop, value, when)`. Same leaf, same class, in the sheet
and in `src/runtime`. Disagreement is a ghost class.

Spelling is ours (`mt_2r`). It must be a pure function of the leaf so lib
+ app concat the same utility.

## Must not

- Name a class from a hashed StyleProp object.
- Own `Want` / `Atom` (`atom/`).
- A second spelling in JS: `js/namer/` mirrors this algorithm, held
  byte-equal by the namer goldens.

Up: [stylesheet](../README.md).
