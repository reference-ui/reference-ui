# Extract / recipes

Finds `recipe()` / `recipe.raw()` calls and extracts the **style objects**
inside them: `base`, each variant item, `compoundVariants[].css`.

```ts
recipe({
  base: { color: 'white' },
  variants: { size: { sm: { fontSize: '12px' } } },
})
```

Those wants currently compile as utilities. Closed `@layer recipes`
classes are a later pass (`ATM-RECIPE-*`), still unproven. This folder
only finds the expressions.

## Must not

- Invent a slot-recipe / `sva` author API.
- Emit recipe class tables here.
