# Managed Matrix Tsconfig

This folder owns the generated `tsconfig.json` used by synthetic matrix consumers inside Dagger.

The matrix runner should not duplicate tsconfig shape inline. Keeping it here makes the downstream TypeScript contract explicit and testable.

## Tests

- `pnpm --dir pipeline exec tsx --test src/testing/matrix/managed/tsconfig/index.test.ts`
