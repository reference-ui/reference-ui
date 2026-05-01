# Test Migration Plan

## Scope

This plan compares the legacy Playwright specs in:

- `packages/reference-e2e/src/tests/core`

against the current matrix-owned coverage under `matrix/`.

The goal is not to preserve every old file name. The goal is to preserve every real contract and edge case before removing legacy suites.

## Bottom line

The new matrix tests do cover most of the old `reference-e2e` core suite, and in several areas they are already stronger than the legacy Playwright specs.

They do **not** literally cover all of it yet.

Current verdict for `packages/reference-e2e/src/tests/core`:

- most files are already subsumed by matrix coverage
- one slice still needs explicit follow-up before the old core suite is fully redundant

The repo should treat `matrix/` as the destination, but use the **current** matrix packages where they already exist instead of assuming the placeholder packages mentioned in older docs already landed.

## `reference-e2e` Core Coverage

| Legacy file | Closest matrix replacement | Status | Recommendation |
| --- | --- | --- | --- |
| `packages/reference-e2e/src/tests/core/color-mode.spec.ts` | `matrix/color-mode/tests/e2e/system-contract.spec.ts` | Fully covered and stronger | Retire after one green pipeline cycle with matrix-only confidence |
| `packages/reference-e2e/src/tests/core/container-responsive.spec.ts` | `matrix/responsive/tests/e2e/system-contract.spec.ts` | Fully covered | Retire |
| `packages/reference-e2e/src/tests/core/jsx-elements.spec.ts` | `matrix/primitives/tests/e2e/primitives-contract.spec.ts` | Fully covered | Retire |
| `packages/reference-e2e/src/tests/core/style-props.spec.ts` | `matrix/primitives/tests/e2e/primitives-contract.spec.ts` | Fully covered and broader | Retire |
| `packages/reference-e2e/src/tests/core/sync-watch.spec.ts` | `matrix/watch/tests/e2e/watch-contract.spec.ts` | Fully covered and stronger | Retire |
| `packages/reference-e2e/src/tests/core/tokens.spec.ts` | `matrix/tokens/tests/e2e/system-contract.spec.ts` | Fully covered | Retire |
| `packages/reference-e2e/src/tests/core/core-system.spec.ts` | `matrix/system/tests/e2e/system-contract.spec.ts` plus matrix generated-output suites in `css`, `primitives`, `responsive`, and `recipe` | Functionally covered, but the exact one-line on-disk smoke is not mirrored one-for-one in `matrix/system` | Either add a tiny `styles.css exists` unit smoke to `matrix/system`, or explicitly decide the broader generated-output coverage is sufficient, then retire |
| `packages/reference-e2e/src/tests/core/token-sync-watch.spec.ts` | `matrix/watch/tests/e2e/watch-contract.spec.ts` | Fully covered | Retire after one green pipeline cycle with matrix-only confidence |

## Old `core` Edge Cases Still Worth Preserving

These are the remaining old-core behaviors that still deserve a named owner before the last legacy specs disappear.

1. Explicit on-disk sync artifact smoke for `@reference-ui/react/styles.css`.
   - Legacy source: `packages/reference-e2e/src/tests/core/core-system.spec.ts`
   - Current matrix coverage proves mounted styles and parses generated stylesheets in multiple packages, but the exact single-assertion smoke has not been re-homed in `matrix/system` itself.

## Recommended Migration Order

### Phase 1: finish the old `core` tail

1. Decide whether the old `core-system` artifact smoke should:
   - move into `matrix/system/tests/unit`, or
   - be considered redundant because generated-output coverage already exists across multiple matrix packages.
2. After that, remove the remaining `reference-e2e/src/tests/core` files.

## Retirement Gates

### Safe to retire now

- `packages/reference-e2e/src/tests/core/color-mode.spec.ts`
- `packages/reference-e2e/src/tests/core/container-responsive.spec.ts`
- `packages/reference-e2e/src/tests/core/jsx-elements.spec.ts`
- `packages/reference-e2e/src/tests/core/style-props.spec.ts`
- `packages/reference-e2e/src/tests/core/sync-watch.spec.ts`
- `packages/reference-e2e/src/tests/core/token-sync-watch.spec.ts`
- `packages/reference-e2e/src/tests/core/tokens.spec.ts`

### Keep until a named matrix replacement lands

- `packages/reference-e2e/src/tests/core/core-system.spec.ts` unless the team explicitly accepts broader matrix output coverage as sufficient

## Definition Of Done

We can say the migration is complete when all of the following are true:

1. Every remaining legacy test maps to a named matrix file or a deliberate keep-local justification.
2. No product-critical browser-CSS assertions depend on `happy-dom` workarounds.
3. `reference-e2e` is no longer the default owner of matrix orchestration.
4. The remaining legacy core specs are either deleted or reduced to temporary compatibility smoke tests.