# Internal

Internal utilities that extend the design system via the API. Used by config generation, not shipped directly.

## Structure

This folder contains internal design system extensions organized by feature:

- **tokens.ts** — Default design tokens (colors, spacing, etc.)
- **container/** — Container query pattern
- **r/** — Responsive container query pattern  
- **font/** — Font system (runtime generation during `ref sync`)

## Pattern Extensions

Each pattern extension lives in its own directory and extends the Panda box pattern:

### Container (`container/`)

Set up container context for container queries.

```tsx
<Div container="sidebar">Container Context</Div>
```

### Responsive (`r/`)

Responsive styles using container queries.

```tsx
<Div container r={{ 400: { padding: '1rem' }, 800: { padding: '2rem' } }}>
  Responsive
</Div>
```

### Font (`font/`)

Font system with dynamic generation. Users define fonts with the `font()` API, and the CLI generates tokens, @font-face rules, recipes, and pattern extensions during `ref sync`.

See `font/README.md` for details.

## Build Flow

1. **Source files** — Pattern extensions define using `extendPattern()` (e.g. `container/`, `r/`)
2. **Collection** — `build/boxPattern.ts` scans and collects extensions
3. **Generation** — Pattern fragment is written to `system/styled/fragments/internal/patterns.mjs` (styled mirrors outDir)
4. **Bundling** — `build/styled.ts` includes that fragment in internal-fragments.mjs
5. **Panda** — Generated config includes box pattern extensions

## Dependencies

Internal modules use the **api** (`system/api`):

- `extendPattern` — add properties to box pattern
- `extendPandaConfig` — extend Panda config directly
- `tokens` — contribute tokens
- `font` — define fonts (user-facing, handled at runtime)
- etc.

## Relationship to styled

- **styled** — Panda output (generated). Primitives import from here.
- **internal** — Source code that contributes to how styled gets generated. Uses api to extend the config that drives Panda.
