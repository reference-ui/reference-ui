# Internal

Internal utilities that extend the design system via the API. Used by config generation, not shipped directly.

## Structure

This folder contains internal design system extensions:

- **tokens.ts** — Default design tokens (colors, spacing, etc.)
- **props/** — Pattern prop definitions (font, container, r)
- **box.ts** — Generated combined box pattern (gitignored, built by `build/boxPattern.ts`)

## Pattern Props

Pattern props extend the Panda box pattern with custom properties:

### Font Props (`props/font.ts`)

- `font` — Font family preset (sans, serif, mono)
- `weight` — Font weight token (e.g., sans.bold, serif.normal)

```tsx
<Div font="sans" weight="sans.bold">Bold Sans</Div>
```

### Container Props (`props/container.ts`)

- `container` — Set up container context for container queries

```tsx
<Div container="sidebar">Container Context</Div>
```

### Responsive Props (`props/r.ts`)

- `r` — Responsive styles using container queries

```tsx
<Div container r={{ 400: { padding: '1rem' }, 800: { padding: '2rem' } }}>
  Responsive
</Div>
```

## Build Flow

1. **Source files** — `props/*.ts` define pattern extensions using `extendPattern()`
2. **Collection** — `build/boxPattern.ts` scans and collects extensions
3. **Generation** — `box.ts` is generated with inlined transforms
4. **Bundling** — `build/styled.ts` includes `box.ts` in internal fragments
5. **Panda** — Generated config includes box pattern extensions

## Dependencies

Internal modules use the **api** (`system/api`):

- `extendPattern` — add properties to box pattern
- `extendPandaConfig` — extend Panda config directly
- `tokens` — contribute tokens
- `utilities` — contribute utilities
- etc.

## Relationship to styled

- **styled** — Panda output (generated). Primitives import from here.
- **internal** — Source code that contributes to how styled gets generated. Uses api to extend the config that drives Panda.
