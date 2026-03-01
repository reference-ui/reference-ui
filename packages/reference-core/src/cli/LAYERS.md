# LAYERS — Implementation Plan

`layers: []` is the second composition mode. Where `extends` adopts a system's tokens into your
global space, `layers` includes a system's component CSS in an isolated cascade layer — tokens stay
out entirely.

The TypeScript contract is the key constraint:

- **Library A** defines `colorA` via `extendTokens`. Panda generates types. TypeScript in Library
  A's dev environment knows `colorA` exists.
- **Library B** consumes Library A via `layers: [libraryABaseSystem]`. Library A's tokens are
  **not** merged into Library B's Panda config. Library B's TypeScript has no knowledge of
  `colorA`. But Library A's component CSS renders correctly, scoped to `@layer library-a`.

---

## What needs to exist on `BaseSystem`

`BaseSystem` currently carries: `name`, `tokens`, `font`, `keyframes`, `globalCss`.

`layers` needs CSS. Add an optional field:

```ts
export interface BaseSystem {
  name: string
  tokens: Record<string, unknown>
  font: Record<string, unknown>
  keyframes: Record<string, unknown>
  globalCss: Record<string, unknown>
  css?: string // pre-compiled component CSS, scoped to @layer <name> + [data-layer] token block
}
```

When a consumer specifies `layers: [libraryABaseSystem]`, `ref sync` reads `baseSystem.css` from
that artefact and writes it into the consumer's output — nothing else from that system is touched.

---

## New output from `ref sync`: `createLayerCss`

After Panda codegen runs for a package, a new step captures what Panda emitted and bundles it:

```
ref sync (for Library A)
  → createPandaConfig     → panda.config.ts          (existing)
  → panda codegen         → src/system/styles.css     (existing)
  → createBaseSystem      → dist/baseSystem.mjs       (existing)
  → createLayerCss        → (embedded in baseSystem)  (new)
```

`createLayerCss` does three things:

1. Reads the Panda-emitted `src/system/styles.css`
2. Wraps the component CSS in `@layer <name> { ... }`
3. Appends a `[data-layer="<name>"] { ... }` block containing all token custom properties
   scoped to that selector (for the `layer` prop — see below)
4. Serialises the result as a string and embeds it as `css` on the `baseSystem` object before
   microbundling

The `[data-layer]` token block does not need to be reconstructed from fragments. Panda already
emits a dedicated `@layer tokens { :where(:root, :host) { --colors-...: ...; } }` block in
`styles.css`. `createLayerCss` extracts that block and re-scopes its selector from
`:where(:root, :host)` to `[data-layer="<name>"]`. No re-derivation needed — Panda's own output
is the source of truth.

Note: Panda has a `layers` config option for renaming its internal layer identifiers (`utilities`,
`recipes`, `tokens`, etc.). This is unrelated to what we are building. We are not using it.

---

## `entryTemplate.ts` — layers are CSS only, not config

When `config.layers` is non-empty, the Panda entry template must not merge those systems' tokens
into `config.theme.tokens`. Only `config.extends` contributes tokens to Panda.

Current extends handling in `entryTemplate.ts`:

```ts
for (const sys of upstream) {
  if (sys?.tokens) config.theme.tokens = deepMerge(config.theme.tokens, sys.tokens)
}
```

Layers entries must not appear here. The entry template receives `extends` and `layers` as
separate arrays. `layers` is never touched by the Panda config path.

---

## Consumer-side CSS assembly

When `ref sync` runs for Library B (which has `layers: [libraryABaseSystem]`):

1. For each entry in `config.layers`, extract `entry.css`
2. Write each to `.ref/layer-<name>.css`
3. Inject each via the virtual CSS pipeline (same mechanism as `styles.css` today)

Library B's output CSS ends up with Library A's component styles in `@layer library-a`, entirely
isolated from Library B's own `@layer` scopes and `:root` tokens.

---

## `ReferenceUIConfig` — add `layers`

```ts
/**
 * Include an upstream system's component CSS in an isolated cascade layer.
 * Components render correctly. Tokens do NOT land in your Panda config or TypeScript types.
 */
layers?: BaseSystem[]
```

Validate that each entry in `layers` has a `css` field. Warn if missing — it means the upstream
package has not yet run `ref sync` with `createLayerCss`.

---

## The `layer` prop on primitives

The `layer` prop is the runtime counterpart. Its value is a `name` from a `BaseSystem` in the
chain. It renders as `data-layer` on the DOM element.

```tsx
<Div layer="library-a">
  <Button /> {/* resolves Library A's ref.* tokens from [data-layer="library-a"] */}
</Div>
```

### Why it works

Panda's `styles.css` always has this structure:

```css
@layer reset, base, tokens, recipes, utilities;   ← top-level order declaration

@layer reset { ... }
@layer tokens { :where(:root, :host) { --colors-gray-50: ...; ... } }
@layer recipes { ... }
@layer utilities { ... }
```

The top-level `@layer ..., ...;` order declaration is a CSS spec constraint — it must appear at
the stylesheet root and is silently ignored if nested. Simply wrapping the whole file would break
explicit ordering.

`createLayerCss` handles this in three steps:

**Step 1 — Strip the order declaration.**
The remaining `@layer { ... }` blocks appear in Panda's fixed emission order: reset → base →
tokens → recipes → utilities. That order is stable and controlled by us. The comma-separated
declaration is a safety net for arbitrary sheets — here we own the output, so source order is
sufficient and reliable.

**Step 2 — Wrap the remaining blocks in `@layer library-a { ... }`.**
CSS nested layers are valid and spec-compliant. The result is `library-a.reset`,
`library-a.tokens`, `library-a.recipes`, etc. — fully namespaced, zero collision with whatever
the consumer declares.

**Step 3 — Re-scope the token variables.**
The `@layer tokens` block scopes custom properties to `:where(:root, :host)` — they won't inherit
into descendants based on cascade layer position alone. Extract those declarations and append them
outside the wrapper under `[data-layer="library-a"]`. Now any DOM descendant of that element
inherits the full token set via normal CSS custom property inheritance.

```css
@layer library-a {
  @layer reset { ... }
  @layer tokens { :where(:root, :host) { --colors-gray-50: ...; ... } }
  @layer recipes { ... }
  @layer utilities { ... }
}

[data-layer='library-a'] {
  --colors-brand-primary: #0052cc;
  --ref-color-text: #1a1a1a;
  /* full token set, re-scoped for DOM inheritance */
}
```

This is post-processing, not patching. The surgery is small, encapsulated, and spec-compliant.
Panda's output is the input — we reshape it once at build time, embed the result in `baseSystem`,
and consumers never touch Panda directly.

CSS custom properties inherit through the DOM. Every descendant of `[data-layer="library-a"]`
resolves the right values. No JS. No context. No coordination.

### Primitive change

Add `layer?: string` to the base primitive props. If present, spread `{ 'data-layer': layer }`
onto the rendered element. The prop is stripped from Panda's style processing — it is a DOM
attribute, not a style prop.

---

## TypeScript isolation — how it holds

| scenario                   | Panda sees tokens?      | TypeScript sees tokens? | CSS renders?                        |
| -------------------------- | ----------------------- | ----------------------- | ----------------------------------- |
| Library A (owner)          | yes — full codegen      | yes                     | yes                                 |
| Library B — `extends: [A]` | yes — merged into theme | yes                     | yes                                 |
| Library B — `layers: [A]`  | no                      | no                      | yes — via `@layer` + `[data-layer]` |

The isolation is enforced at the Panda config generation step. `layers` entries never touch
`config.theme.tokens`. Panda never sees them. Codegen never emits types for them. TypeScript
never knows they exist.

---

## Order of work

1. Add `css?: string` to `BaseSystem` type
2. Add `layers?: BaseSystem[]` to `ReferenceUIConfig`
3. Implement `createLayerCss` — reads Panda output, wraps in `@layer`, appends `[data-layer]`
   token block, embeds on `baseSystem`
4. Update `createBaseSystem` to call `createLayerCss` and include result in emitted artefact
5. Update `entryTemplate.ts` — `layers` entries excluded from `config.theme.tokens` merge
6. Update `system/run.ts` — inject `layers[].css` into consumer's virtual CSS output
7. Add `layer` prop to primitives (`src/primitives/`)
8. Verify in reference-lib → reference-app: Library A tokens absent from Library B TypeScript,
   components render, `layer` prop scopes correctly
