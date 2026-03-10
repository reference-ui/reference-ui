# @reference-ui/lib

Foundational design system package built on `@reference-ui/core`.

## Exports

- `@reference-ui/lib`: exports `baseSystem` for downstream `extends: [baseSystem]`
- `@reference-ui/lib/theme`: exports the plain theme objects used to build that system

## Usage

```bash
pnpm run sync   # Run ref sync once
pnpm run dev    # Watch mode
```

```ts
import { baseSystem } from '@reference-ui/lib'
import { colors, fonts } from '@reference-ui/lib/theme'
```
