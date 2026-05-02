# matrix/chain/T1 — Extend one library

**Topology:** `Library A ──▶ extend ──▶ User space`

**Chain topology:** T1 (core proof set)

## What this tests

When a consumer declares `extends: [LibA]` in its `ui.config.ts`:

- The upstream library's `fragment` surface is pulled into Panda config generation
- Upstream tokens are visible in the consumer's generated types and CSS variables
- Upstream portable CSS is included in the assembled stylesheet
- Upstream JSX elements and component metadata are available in the consumer

## Fixture used

`@fixtures/extend-library` — provides `fixtureDemoBg`, `fixtureDemoText`, and
`fixtureDemoAccent` tokens along with the `DemoComponent` and `LightDarkDemo`
components. All are adopted by this package via `extends`.

## Tests

- `tests/unit/runtime.test.ts` — Verifies the component tree renders and the marker is correct.
- `tests/e2e/T1-contract.spec.ts` — Browser assertions confirming that upstream
  tokens resolve to the expected color values in computed styles.
