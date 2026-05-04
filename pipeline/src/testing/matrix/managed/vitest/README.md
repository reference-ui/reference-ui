# Managed Matrix Vitest

This folder owns the shared Vitest config shape used by standard matrix fixtures and generated matrix consumers.

Most matrix packages use the same unit-test include contract. The only current variation is optional `globalSetup`, which stays explicit in this module instead of being spread across runner code.

## Scope

- emit the shared `tests/unit/**/*.test.{ts,tsx}` include contract
- optionally emit fixture-specific `globalSetup` when the fixture provides one
- keep generated consumer Vitest config separate from fixture package setup and runner orchestration

## Tests

- `pnpm --dir pipeline exec tsx --test src/testing/matrix/managed/vitest/index.test.ts`