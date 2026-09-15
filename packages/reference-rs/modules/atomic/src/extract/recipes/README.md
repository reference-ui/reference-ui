# Extract / recipes

Finds `recipe()` / `recipe.raw()` calls and builds **Recipe IR**:
`className` / binding stem, `base`, each variant item,
`compoundVariants[].css`. Those style objects do **not** join the
utility want list.

```ts
import { recipe } from '@reference-ui/react'
recipe({
  className: 'button',
  base: { color: 'white' },
  variants: { size: { sm: { fontSize: '12px' } } },
})
```

Closed classes and the variant table are `src/recipes` (`ATM-RECIPE-*`).
This folder only finds the expressions. `sva` is not a site.

## Must not

- Invent a slot-recipe / `sva` author API.
- Push recipe leaves into the utility AtomSet.
- Match the identifier `recipe` without an import binding.
