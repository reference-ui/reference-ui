# reference-lib TODO

`@reference-ui/lib` is the first-party foundational design system built on `@reference-ui/core`.

Users consume it as:

```ts
import { baseSystem } from '@reference-ui/lib'
```

Theme source-of-truth lives in:

- `src/theme/colors.ts`
- `src/theme/spacing.ts`
- `src/theme/radii.ts`
- `src/theme/fonts.ts`
- `src/theme/global.ts`
- `src/theme/animations/*`
- `src/theme/primitives/*`

Each theme file should:

1. Export the plain JS objects for tests and downstream consumers
2. Register the corresponding `tokens()`, `font()`, `globalCss()`, or `keyframes()` calls

Tests that need exact theme values should import from:

```ts
import { colors, rootThemeVars, fonts } from '@reference-ui/lib/theme'
```
