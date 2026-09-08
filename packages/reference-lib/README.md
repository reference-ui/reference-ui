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

## Testing

Component primitives are implemented in this package and proven in `matrix/lib` with Playwright. React 19 is the default agent loop; 17 and 18 are compatibility jobs for that fixture only. See [TESTING.md](./TESTING.md).

## Component playground (Book)

Book is the component playground for `@reference-ui/lib`. It lives at `packages/reference-lib/book/` and serves on port 5000 as a single-document Fast Refresh app. Component stories are authored alongside components in `src/components/**/*.book.tsx`.

To launch Book: run `pnpm dev:lib` from the repository root (or `pnpm run dev` within this package). Open [http://localhost:5000](http://localhost:5000). To capture component states via Playwright, use `pnpm capture <Component>`.

```ts
import { baseSystem } from '@reference-ui/lib'
import { colors, fonts } from '@reference-ui/lib/theme'
```
