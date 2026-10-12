# Resolve / tokens

Turns author-facing token paths into CSS variable references by looking
up the `BaseSystem` dictionary.

Examples:

- `ui.focus.ring` → `var(--colors-ui-focus-ring)` (category from the token
  dictionary, not from guessing)
- `gray.800` → `var(--colors-gray-800)`
- already-`var(--…)` values pass through
- complete CSS values (`rgba(…)`, `translateX(…)`, `red`, `13px`) fence
  before lookup: CSS wins over tokens, silently (`ATM-TOKEN-14`)
- bare misses pass through silently off color props; on color props they
  warn `ATM-W-UNKNOWN-COLOR` (`ATM-TOKEN-16`)

A **tone** names a colour at a theme-owned opacity: `blue.500/medium` emits
`color-mix(in srgb, var(--colors-blue-500) var(--tones-medium-surface), transparent)`.
Tones are ordinary `tones`-category tokens whose value is a percentage (`10%`,
`12.5%`) or a reference to another tone. The property receiving the value picks
the role: `border*` / `outline*` / strokes / text draw `line`, everything else
draws `surface`. Lookup tries `tones.N.line|surface`, then the flat `tones.N`,
then `tones.N.surface`. On a bare value an unknown or unusable tone warns and
stays raw; inside `{…}` it is an error that drops the atom. A whole braced value,
such as the colour longhand a `border` shorthand decomposes into, is refused the
same way.

OKLCH and semantic color-mode resolution already have an owner: `tokens()`
in reference-core / Atlas. This module **looks up** the compiled dictionary
from `BaseSystem`. It does not become a second color science crate.

`_dark` / `_light` are pseudo-props (`resolve/conditions/pseudoprops`), not token
renames. A leaf `color: 'gray.800'` under `_dark` is still this lookup,
then a condition chain.

## Must not

- Invent a second OKLCH pipeline.
- Drop unknown paths silently. Fail closed: diagnostic + `Raw` / passthrough
  only when the author wrote a raw CSS value.
