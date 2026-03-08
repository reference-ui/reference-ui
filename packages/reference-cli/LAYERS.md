# Layers — reference-cli implementation

`layers: []` is the second composition mode. Where `extends` adopts an upstream system's tokens into your config and global space, `layers` includes an upstream system's component CSS in an isolated cascade layer — tokens stay out of your Panda config and TypeScript types entirely.

## Contract

- **extends** — Upstream `fragment` is merged into config generation. Tokens, keyframes, fonts, etc. land in your Panda config and `:root`. You can reference upstream tokens in your own components.
- **layers** — Upstream `css` (pre-compiled, layer-ready) is appended to your output stylesheet. Components render correctly. Tokens do **not** land in your Panda config or TS types. Use when you want components without adopting their token scale.

The primitive `layer` prop is the runtime counterpart: its value is a `BaseSystem.name`. It renders as `data-layer` on the DOM so descendants inherit that system's token variables via `[data-layer="<name>"] { ... }`.

## Why `layer` is a runtime prop, not a Panda pattern extension

The `layer` prop does not affect Panda's style generation. It is a DOM attribute that selects which token scope applies to a subtree. Adding it to the box pattern would mix concerns (Panda never needs to see `layer`), and primitives already own the prop and emit `data-layer`. So we keep it as a simple runtime prop on generated primitives only.

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
3. Primitives can set `layer="upstream-name"` so that subtree uses the upstream token scope.

## Implementation details

- **Layer transform** lives under `src/system/layers/`. It reads raw Panda CSS and returns the layer-wrapped string plus the `[data-layer]` token block. Same semantics as the old reference-core `createLayerCss` (strip order declaration, wrap, extract and re-scope tokens).
- **baseSystem emission** in `src/system/base/create.ts` (or equivalent) must have access to the current system's generated CSS path and config name so it can call the layer transform and set `baseSystem.css`.
- **Consumer CSS assembly** happens where the final `styles.css` (or equivalent) is written; that path must append `config.layers[].css` when present.
- **Validation** in `src/config/validate.ts`: entries in `layers` should have a non-empty `name`; once we reliably emit `css`, we can warn or error when `layers[].css` is missing (upstream not yet synced).

## Caveats and test expectations

- Upstream layer tokens must not appear in the consumer's Panda theme or generated TypeScript.
- The top-level Panda `@layer ...;` order declaration cannot be nested; the transform strips it and relies on source order inside the single wrapped `@layer <name>` block.
- Token declarations extracted for `[data-layer]` should be dedented/normalised so the emitted block has consistent indentation.
- Tests should assert: `layers: [baseSystem]` appends upstream CSS; `layer="name"` scopes token resolution; upstream token names do not appear in consumer types or theme.
