# chain-t1 — Extend one library

**Topology:**
```
  Library A ──▶ extend ──▶ User space
```

**Chain topology:** T1 (core proof set)

## What this tests

When a consumer declares `extends: [LibA]` in its UI config:

- The upstream library's `fragment` surface is pulled into Panda config generation
- Upstream tokens are visible in the consumer's generated types and CSS variables
- Upstream portable CSS is included in the assembled stylesheet
- Upstream JSX elements and component metadata are available in the consumer
- Upstream `_private` token subtrees are stripped before they reach the
  consumer's Panda config: a downstream `css({ color: '_private.brand' })`
  attempt generates no rule and does not resolve

## Fixture used

`@fixtures/extend-library` — provides `fixtureDemoBg`, `fixtureDemoText`, and
`fixtureDemoAccent` tokens along with the `DemoComponent` and `LightDarkDemo`
components. All are adopted by this package via `extends`.

## Tests

- The node-side runtime suite verifies the component tree renders and the marker is correct.
- The browser contract spec confirms that upstream
  tokens resolve to the expected color values in computed styles, plus the
  `_private` boundary: the upstream private swatch does not resolve outside
  its data-layer scope and the downstream `_private.brand` attempt fails.
