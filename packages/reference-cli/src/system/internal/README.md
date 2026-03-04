# Internal

Internal utilities that extend the design system via the API. Used by config generation, not shipped directly.

## Source

This folder will be populated from **@reference-ui/core** `src/styled`:

- **rhythm/** — `getRhythm`, `rhythmUtilities`, `resolveRhythm`
- **props/** — `box`, `container`, `font`, etc. (prop definitions that extend patterns)

## Dependencies

Internal modules use the **api** (`system/api`):

- `extendPattern` — add properties to box, container, etc.
- `extendTokens` — contribute tokens
- `extendRecipe` — contribute recipes
- etc.

## Flow

```
api (extendPattern, extendTokens, ...) ← internal (rhythm, props)
```

Rhythm provides CSS calc helpers (`getRhythm(2)` → `calc(2 * var(--spacing-r))`). Props define how `box`, `container`, `font`, `r` etc. map to Panda config. Both are consumed when generating `panda.config.ts` — they extend the base config that Panda uses.

## Relationship to styled

- **styled** — Panda output (generated). Primitives import from here.
- **internal** — Source code that contributes to how styled gets generated. Uses api to extend the config that drives Panda.
