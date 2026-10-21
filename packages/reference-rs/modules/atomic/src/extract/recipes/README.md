# Extract / recipes

Finds `recipe()` / `recipe.raw()` calls and builds **Recipe IR** for them.
The IR keeps the `className` or binding stem, `base`, each variant item,
and `compoundVariants[].css`. Those style objects do **not** join the
utility want list.

```ts
import { recipe } from '@reference-ui/react'
recipe({
  className: 'button',
  base: { color: 'white' },
  variants: { size: { sm: { fontSize: '12px' } } },
})
```

With `slots: ['root', 'title']`, `base`, each variant value and each `compoundVariants[].css` are keyed by slot. The walk runs once per slot over that slot's entries and emits one Recipe IR per slot, named `{className}__{slot}`, which carries the call's className for gating. A malformed list, or a slot key the list does not name, refuses the whole definition with `ATM-E-RECIPE-SLOT`.

Closed classes and the variant table are the `recipes` stage (`ATM-RECIPE-*`).
This folder only finds the expressions. `sva` is not a site.

## Must not

- Invent an `sva` author API: slots are a key on `recipe()`.
- Push recipe leaves into the utility AtomSet.
- Match the identifier `recipe` without an import binding.
