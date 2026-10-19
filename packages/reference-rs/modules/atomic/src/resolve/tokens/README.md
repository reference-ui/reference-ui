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
- bare misses pass through silently, except two shapes that warn: on color
  props `ATM-W-UNKNOWN-COLOR` (`ATM-TOKEN-16`), and on spacing, radius, size
  and font-size props `ATM-W-UNKNOWN-TOKEN` for a bare identifier that is no
  token in that category and no CSS keyword the prop accepts (`bare_name`;
  `ATM-TOKEN-24`, `ATM-TOKEN-25`). Numbers, lengths and functions never warn.
- a whole token value that names another token without braces (`gray.900`
  for `colors.gray.900`) prints verbatim under `ATM-W-UNBRACED-TOKEN-REF`, which
  suggests the braced form. That check lives in `stylesheet::system_layers`,
  where `@layer tokens` is printed, not in this resolver (`ATM-TOKEN-26`).

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
in `@reference-ui/core` token collection. This module **looks up** the compiled dictionary
from `BaseSystem`. It does not become a second color science crate.

`_dark` / `_light` are pseudo-props (`resolve::conditions::pseudoprops`), not token
renames. A leaf `color: 'gray.800'` under `_dark` is still this lookup,
then a condition chain.

## Must not

- Invent a second OKLCH pipeline.
- Drop unknown paths silently. Fail closed: diagnostic + `Raw` / passthrough
  only when the author wrote a raw CSS value.

Up: resolve.
