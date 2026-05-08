# `@matrix/typescript`

Type-only matrix package. Verifies that `ref sync` correctly composes the
strict-token wrappers on `SystemStyleObject` based on `ui.config.ts`'s
`strict` array.

## What it checks

`src/strict-tokens.assertions.ts` declares value-shaped objects typed as
`SystemStyleObject`. Each invalid case is preceded by `// @ts-expect-error`.

When the matrix runs:

1. `ref sync` regenerates the consumer's `@reference-ui/types` package using
   `strict: ['colors', 'radii']` from this package's `ui.config.ts`.
2. The pipeline runs `pnpm exec tsc --noEmit` (because `matrix.json` sets
   `runTypecheck: true`).
3. tsc fails if a `@ts-expect-error` directive is unused — i.e. if the
   strict wrapper failed to land — or if a valid token assignment is
   incorrectly rejected.

Add new assertions when adding a new strict category or escape hatch. Keep
this surface narrow: it is a regression net, not a tutorial.
