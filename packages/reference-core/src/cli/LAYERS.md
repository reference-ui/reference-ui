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

## Implementation status

| step | what                                                                     | status      |
| ---- | ------------------------------------------------------------------------ | ----------- |
| 1    | `css?: string` on `BaseSystem`                                           | ✅ done     |
| 2    | `layers?: BaseSystem[]` on `ReferenceUIConfig`                           | ✅ done     |
| 3    | `createLayerCss` — wraps Panda output, appends `[data-layer]` block     | ✅ done     |
| 4    | `createBaseSystem` calls `createLayerCss`, embeds `css` in artefact     | ✅ done     |
| 5    | `entryTemplate.ts` — `layers` excluded from token merge                 | ✅ done     |
| 6    | `appendLayerCss` in packager — appends `layers[].css` to `styles.css`   | ✅ done     |
| 7    | `layer` prop on primitives                                               | ⬜ not done |
| **8**| **Named virtual spaces — fix token bleed (see below)**                   | ❌ bug      |

---

## Bug: token bleed via shared `.virtual/` namespace

### What's happening

`panda.base.ts` scans `.virtual/**/*.{ts,tsx}`. The `.virtual/` directory under `reference-core`
is a **shared flat namespace** — every package that runs `ref sync` copies its `src/**` files
into the same `reference-core/.virtual/` tree.

When **Library A** (`reference-lib`) syncs:

```
reference-lib/src/styled/theme/canary.ts
  → reference-core/.virtual/src/styled/theme/canary.ts
```

When **Library B** (`reference-docs`) later syncs with `layers: [libBaseSystem]`, Panda scans
`.virtual/**` and picks up `canary.ts`. The `extendTokens` call inside it runs. `refLibCanary`
lands in Panda's theme. The Panda `**/node_modules/**` exclude doesn't help — the file isn't in
node_modules, it's in `.virtual/src/`.

Result: `refLibCanary` utilities appear in Library B's `styles.css` and its TypeScript types,
even though `reference-lib` is consumed via `layers` (not `extends`).

Additionally, the `pnpm workspace:*` symlinks cause `.virtual/node_modules/@reference-ui/lib/` to
exist as a real directory populated with lib's project files. Panda's own glob would also walk
these unless `**/node_modules/**` is correctly applied by Panda's file scanner — which it is, but
it does not fix the `.virtual/src/` bleed above.

### The fix: named virtual spaces

Scope each consumer's virtual directory to its own `name`:

```
.virtual/reference-ui/src/styled/theme/canary.ts    ← reference-lib's files
.virtual/reference-docs/src/...                     ← reference-docs' files (separate)
```

**Changes required:**

**`virtual/run.ts` + `virtual/sync.ts`** — resolve `absVirtualDir` to
`resolve(coreDir, virtualDir, config.name)` instead of `resolve(coreDir, virtualDir)`.

**`createPandaConfig`** — the generated `panda.config.ts` must include only the consumer's own
named space. `panda.base.ts` has a static `.virtual/**` pattern. `createPandaConfig` already
post-processes the bundled output (see the `includeCodegen` replacement); add a second
find-and-replace that narrows `.virtual/**` to `.virtual/<name>/**`:

```ts
// in createPandaConfig, after bundling:
output = output.replace('".virtual/**/*.{ts,tsx,js,jsx}"', `".virtual/${config.name}/**/*.{ts,tsx,js,jsx}"`)
```

`config.name` comes from the `ReferenceUIConfig` passed to `createPandaConfig` (already
threaded through via `options`). When the pattern appears twice (the array has two identical
entries from `panda.base.ts`), both occurrences must be replaced.

**Migration**: the shared `.virtual/` should be cleaned on `ref sync` before the named copy runs,
or at minimum a warning should log if old flat files exist.

---

## Bug: `[data-layer]` indentation inconsistency

`createLayerCss`'s `extractTokenDeclarations` returns the inner declaration block with `.trim()`
applied — this strips the leading whitespace from the **first** line only. All subsequent lines
retain their original indentation, producing:

```css
[data-layer="reference-ui"] {
--colors-gray-50: oklch(...);       ← no indent (trimmed)
    --colors-gray-100: oklch(...);  ← 4-space indent (original)
}
```

**Fix**: after extracting the declarations, normalise indentation. Strip the common leading
whitespace from every line (dedent), then re-indent uniformly:

```ts
function dedentDeclarations(declarations: string): string {
  const lines = declarations.split('\n').filter(l => l.trim())
  const minIndent = Math.min(...lines.map(l => l.match(/^(\s*)/)?.[1].length ?? 0))
  return lines.map(l => '  ' + l.slice(minIndent)).join('\n')
}
```

Apply before the `[data-layer]` block is assembled in `createLayerCss`.

---

## Order of work (remaining)

1. ✅ ~~Add `css?: string` to `BaseSystem` type~~
2. ✅ ~~Add `layers?: BaseSystem[]` to `ReferenceUIConfig`~~
3. ✅ ~~Implement `createLayerCss`~~
4. ✅ ~~Update `createBaseSystem` to embed `css`~~
5. ✅ ~~`entryTemplate.ts` — `layers` excluded from token merge~~
6. ✅ ~~`appendLayerCss` in packager~~
7. **Fix named virtual spaces** — `virtual/run.ts`, `virtual/sync.ts`, `createPandaConfig`
8. **Fix `[data-layer]` indentation** — `createLayerCss.extractTokenDeclarations`
9. Add `layer` prop to primitives (`src/primitives/`)
10. Verify: Library A tokens absent from Library B TypeScript, components render, `layer` prop
    scopes correctly
