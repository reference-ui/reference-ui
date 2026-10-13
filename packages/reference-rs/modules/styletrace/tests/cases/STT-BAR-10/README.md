# STT-BAR-10 — A type-only re-export mints no component name

`export type { Card as Panel } from './components'` and the inline `export { type Card as Inline }` forms export a type, not a value, so neither Panel nor Inline is a component name.
A type-only import re-exported by name (`import type { Card as TypeCard }` then `export { TypeCard }`) mints nothing either.
The value re-export `export { Card as Value } from './components'` is the control: it still mints Value under its exported name.
