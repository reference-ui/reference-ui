# Fragments test suite

Tests for the fragment collection API as defined in [plan.md](../plan.md).

## API under test

- **Collectors** are created with `createFragmentCollector({ name, targetFunction })` and are callable functions with `config`, `init`, `cleanup`, `getFragments`.
- **Collection** uses the planner API: `collectFragments({ collectors, include })` where `include` is glob patterns (e.g. from `config.include` in `ui.config.ts`). Returns a keyed object: `{ [collectorName]: T[] }`.
- **Scanning** resolves `include` with `fast-glob` and finds files that call any collector’s `targetFunction`; collection runs in a single pass over those files.

## Test layers

| Layer | What’s tested |
|-------|----------------|
| **Unit** | `createFragmentCollector` returns a callable with properties; globalThis isolation; `init` / `cleanup` / `getFragments`. |
| **Integration** | `collectFragments({ collectors, include })` accepts globs, scans once for multiple collectors, returns `{ collectorName: T[] }`; TypeScript and isolation. |
| **E2E** | Full flow: create collectors → export from setup → user code calls them → collect with `config.include`-style patterns; multiple collectors in one pass; nested imports. |

## Fixtures (e2e)

- **`setup.ts`** – Defines and exports collectors via `createFragmentCollector` (e.g. `myFunction` with `name: 'myFunction'`, `targetFunction: 'myFunction'`).
- **`use-function.ts`** – Imports from `./setup` and calls the collector with a fragment.
- **`with-constants.ts`** – Imports from `./setup` and calls the collector with a fragment built from constants.

User files import from `./setup` (stand-in for `@reference-ui/system`). E2E copies these into a temp project and runs `collectFragments({ collectors: [myFunction], include: ['**/*.ts'] })`, then asserts on the keyed result (e.g. `allFragments.myFunction`).

## Running tests

```bash
# All fragment tests
npm test -- fragments

# Single file
npm test -- e2e.test.ts
```

E2E tests are written against the planner API; they may fail until `collectFragments({ collectors, include })` and keyed return are implemented.
