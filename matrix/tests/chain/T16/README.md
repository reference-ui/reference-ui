# chain-t16 — Compose a prebuilt aliased-host package

Prover for the CSS composition investigation: a consumer that composes
**prebuilt, separately-packaged** libraries whose components render style
props on **aliased hosts** (`const Shell = Div as …`) behind `forwardRef`
factories — the `@reference-ui/icons` shape.

## Topology

```
@reference-ui/lib ──▶ extend ──┐
                                ├──▶ chain-t16 (user space)
@fixtures/aliased-host-library ──▶ layer ───┘
```

Lib itself layers the real `@reference-ui/icons`, so the extends branch
proves the **transitive** path (the docs topology); the layers branch
proves a direct prebuilt composition. No `jsxElements` anywhere —
StyleTrace host detection carries both.

## Contract

1. Every class under the test root has a backing CSS rule (owned prefixes
   derived from the top-level `@layer` prelude; only `material-symbols*`
   third-party classes are out of scope).
2. Zero `no compiled class` console warnings during render.
3. Shell computed styles apply (`display: flex`, centered, `line-height:
   0`, `flex-shrink: 0`) on icons (lib re-export and direct import) and
   fixture badges alike.
4. The loaded stylesheets carry exactly one copy of the icons rules: the
   `reference-icons__` rule count equals the icons baseSystem's published
   utilities count, with no duplicate selectors.
