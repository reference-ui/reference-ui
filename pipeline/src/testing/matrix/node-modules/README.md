# Matrix Node Modules Cache

This folder owns the cache policy for the matrix consumer install step.

The goal is to keep matrix entries isolated at the dependency-graph level without paying for a full `pnpm install` relink on every container run.

## What Lives Here

- helpers for computing the shared pnpm store cache key
- helpers for computing the per-install-graph `node_modules` cache key
- helpers for probing and populating warm fixture-local `node_modules` caches
- unit tests for cache invalidation behavior

## Isolation Model

There are two reuse layers:

- pnpm store cache
  - shared when the staged registry manifest fingerprint is the same
  - invalidates when packed internal tarball hashes change
- consumer `node_modules` cache
  - shared only when the effective install graph is the same
  - includes staged internal versions, dependency lists, Node image, and pnpm version
  - intentionally excludes fixture source files so normal code edits do not trigger reinstall work

## Why This Is Separate

The Dagger runner should orchestrate matrix execution, not hide the cache policy inline.

Keeping this in its own module makes it easier to reason about:

- when a cache should be reused
- when a cache must split for isolation
- what future matrix dimensions such as React major versions or bundler-specific dependencies will do to install reuse

## Tests

- `pnpm --dir pipeline exec tsx --test src/testing/matrix/node-modules/cache.test.ts`
- `pnpm --dir pipeline exec tsx --test src/testing/matrix/node-modules/install.test.ts`
- `pnpm --dir pipeline exec tsc --noEmit`