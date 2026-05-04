# Distro Matrix

General systems check. If this suite passes, the full distribution chain is working.

## What It Tests

**Install** — `ref sync` completes in a clean consumer and is idempotent on a second run.

**Type surface** — generated output has the right shape:

- `@reference-ui/react` resolves at runtime and in TypeScript
- primitive style props stay token-aware and reject arbitrary strings
- `css()` accepts valid `CssStyles`
- `@reference-ui/system` APIs match their expected TypeScript signatures

`tsc --noEmit` runs after Vitest to catch regressions that `@ts-expect-error` assertions alone would miss.
