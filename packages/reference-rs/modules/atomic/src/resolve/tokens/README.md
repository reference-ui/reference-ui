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
