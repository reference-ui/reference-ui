# Matrix Discovery

This folder owns discovery of matrix-enabled workspace packages.

## What Lives Here

- parsing `matrix.json`
- deriving the stable `@matrix/<name>` package name used by pipeline
- listing matrix package definitions from the top-level `matrix/` workspace folder
- resolving those definitions back to real workspace packages

## Why This Is Separate

Discovery is the boundary between a fixture folder existing on disk and the rest of the matrix pipeline knowing that it participates in matrix testing.

Keeping that logic separate makes it easier to evolve `matrix.json` over time without mixing config parsing into:

- setup generation
- Dagger execution
- environment planning

## Current Contract

Today a package participates in the matrix when its `matrix.json` declares:

- `name: string`
- `refSync.mode: "full" | "watch-ready"`

It may also declare:

- `runTypecheck: boolean`

This is intentionally small.

Future matrix environment planning should build on this module instead of reimplementing package discovery elsewhere.

## Tests

- `pnpm --dir pipeline exec tsx --test src/testing/matrix/discovery/index.test.ts`
- `pnpm --dir pipeline exec tsc --noEmit`