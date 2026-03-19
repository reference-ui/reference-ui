# @reference-ui/reference-unit

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

### Color mode and token sources

Light/dark token values resolve correctly for all three token sources supported by reference-ui:

1. **extends** — tokens in `@fixtures/extend-library` are merged into the consumer's Panda config; Div props resolve them directly.

2. **layers** — tokens from `@fixtures/layer-library` live inside their own CSS layer; they still resolve on Div because the token CSS variable is emitted into the consumer stylesheet via the layers config.

3. **root** — tokens defined in the root project's own `tokens()` call; the baseline case, always in the consumer's namespace.

Color-mode: `tests/color-mode/data-prop.test.tsx` mounts Divs and asserts resolved colors (with `@layer` stripped for happy-dom — see `flattenCssCascadeLayersForTests` in `tests/primitives/setup.ts`). Dark mode is asserted with `data-panda-theme="dark"` on an ancestor or `colorMode="dark"` on a primitive (matches emitted `[data-layer][data-panda-theme=dark]` selectors). `LightDarkDemo`-style layout: `tests/extends/component.test.tsx` (inlined markup — avoid importing extend-library’s component, which calls `tokens()` at module load) and `tests/layers/component.test.tsx`.

- **Node tests** (`tests/ref-sync.test.ts`, `tests/virtual/*`) run in the default Vitest environment.
- **Primitives tests** (`tests/primitives/*`) run in **happy-dom** (via `@vitest-environment happy-dom`). They use React Testing Library to mount the Div primitive, pass style props, and assert on the DOM and (when design system CSS is present) computed styles.

To run only primitives tests:

```bash
pnpm test -- tests/primitives/
```

Primitives tests resolve `@reference-ui/styled` to the core package’s built styled output (`reference-core/src/system/styled`) via a Vitest alias, so they don’t depend on a successful app `ref sync` for module resolution. Tests under `tests/color-mode/` and demo component tests in `tests/extends/component.test.tsx` / `tests/layers/component.test.tsx` require generated design-system CSS (`ref sync` / `pnpm dev`); they fail fast if `.reference-ui/` is missing instead of skipping.
