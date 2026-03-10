# @reference-ui/reference-app

Reference application demonstrating the current core workflow.

## Usage

Simply run:

```bash
pnpm dev
```

This will:
1. Run `reference sync` to generate design system artifacts
2. Start the Vite dev server

## How it works

- Imports `@reference-ui/core` as a dev dependency
- Uses the `ref` CLI command to sync design system
- No manual Panda CSS configuration needed - handled by the core package

## Testing

- **Node tests** (`tests/ref-sync.test.ts`, `tests/virtual/*`) run in the default Vitest environment.
- **Primitives tests** (`tests/primitives/*`) run in **happy-dom** (via `@vitest-environment happy-dom`). They use React Testing Library to mount the Div primitive, pass style props, and assert on the DOM and (when design system CSS is present) computed styles.

To run only primitives tests:

```bash
pnpm test -- tests/primitives/
```

Primitives tests resolve `@reference-ui/styled` to the core package’s built styled output (`reference-core/src/system/styled`) via a Vitest alias, so they don’t depend on a successful app `ref sync` for module resolution. For full computed-style assertions, the design system CSS must exist (e.g. after a successful `ref sync` that runs Panda); otherwise those tests are skipped.
