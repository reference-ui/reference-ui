# Layers — reference-core implementation

`layers: []` is the second composition mode. Where `extends` adopts an upstream system's tokens into your config and global space, `layers` includes an upstream system's component CSS in an isolated cascade layer — tokens stay out of your Panda config and TypeScript types entirely.

## Contract

- **extends** — Upstream `fragment` is merged into config generation. Tokens, keyframes, fonts, etc. land in your Panda config and `:root`. You can reference upstream tokens in your own components.
- **layers** — Upstream `css` (pre-compiled, layer-ready) is appended to your output stylesheet. Components render correctly. Tokens do **not** land in your Panda config or TS types. Use when you want components without adopting their token scale.

**Layer identity** comes only from `ui.config.name`. That value is the design system’s identity for CSS `@layer` and the `[data-layer]` selector. Primitives automatically render `data-layer="<name>"` on the DOM; there is no runtime `layer` prop. Specify the name once in config and it is used everywhere.

## Why layers are a post-cssgen transform

Panda emits a single `styles.css` with its own internal `@layer` blocks. We do not change Panda config or merge `layers` into theme. Instead, after `pandaCssgen()` completes we:

1. Read the generated CSS.
2. For the current system (when building a baseSystem): transform it once into layer-ready CSS (wrap in `@layer <name>`, re-scope tokens to `[data-layer="<name>"]`) and attach that string to the exported `baseSystem.css`.
3. For the consumer: append each `config.layers[].css` to the final stylesheet.

So the layers pipeline is a CSS post-process step in `system/panda/gen` and (for consumers) in the place that writes the final CSS, not part of config generation.

## How `baseSystem.css` is produced and consumed

**Producing (upstream package):**

1. Config worker runs → `panda.config.ts` is written (only `extends` contribute to config).
2. Panda worker runs → codegen + cssgen → `styles.css` exists under outDir.
3. A layer transform reads `styles.css`, strips the top-level `@layer ...;` order declaration, wraps the rest in `@layer <config.name> { ... }`, extracts the token block and re-emits it as `[data-layer="<name>"] { ... }`.
4. That string is written onto the `baseSystem` artifact as `css` (e.g. in `system/base/create.ts` or equivalent), so the exported `baseSystem` has `name`, `fragment`, and `css`.

**Consuming (app with `layers: [baseSystem]`):**

1. Config and Panda run for the consumer only (no token merge from `layers`).
2. When writing the consumer's final stylesheet, append each `layers[i].css` after the consumer's own CSS. Result: consumer CSS plus `@layer upstream-name { ... }` and `[data-layer="upstream-name"] { ... }`.
3. Primitives from the consumer build automatically get `data-layer="<consumer config.name>"`, so consumer token scope applies. Upstream token scope is only available where upstream components (with their own `data-layer`) are used.

## Implementation details

- **Layer transform** lives under `src/system/layers/`. It reads raw Panda CSS and returns the layer-wrapped string plus the `[data-layer]` token block. Same semantics as the old reference-core `createLayerCss` (strip order declaration, wrap, extract and re-scope tokens).
- **baseSystem emission** in `src/system/base/create.ts` (or equivalent) must have access to the current system's generated CSS path and config name so it can call the layer transform and set `baseSystem.css`.
- **Consumer CSS assembly** happens where the final `styles.css` (or equivalent) is written; that path must append `config.layers[].css` when present.
- **Primitives** are generated with a placeholder for the layer name; at packager time the react bundle is patched with the project’s `config.name`, so every primitive emits `data-layer="<name>"` automatically.
- **Validation** in `src/config/validate.ts`: `name` is required, non-empty, and must be safe for CSS (no double-quotes or newlines). Entries in `layers` must have a non-empty `name`; warn when `layers[].css` is missing (upstream not yet synced).

## Caveats and test expectations

- Upstream layer tokens must not appear in the consumer's Panda theme or generated TypeScript.
- The top-level Panda `@layer ...;` order declaration cannot be nested; the transform strips it and relies on source order inside the single wrapped `@layer <name>` block.
- Token declarations extracted for `[data-layer]` should be dedented/normalised so the emitted block has consistent indentation.
- Tests should assert: `layers: [baseSystem]` appends upstream CSS; primitives emit `data-layer` from config name; upstream token names do not appear in consumer types or theme.
