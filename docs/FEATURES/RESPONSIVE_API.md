# Reference UI: Container Query Responsive System

## Philosophy

1. **All spacing uses `r` units** — no raw numbers, no magic values
2. **Context-aware, not viewport-aware** — container queries over media queries
3. **General purpose, low level** — no predefined breakpoints, users define their own inline
4. **Components are self-contained** — embeddable, nest-safe, MFE-ready

---

# Final API

## The `r` Prop

Streamlined for the 98%. Mobile-first. One container per element.

```tsx
<Container>
  <Box
    padding="2r"
    r={{
      300: { padding: '3r' },
      500: { padding: '4r', gap: '2r' },
    }}
  />
</Container>
```

- **Base styles** — define defaults (e.g. `padding="2r"`)
- **r** — min-width breakpoints only. Keys are container width in `px`, values are style overrides
- **One container per element** — anonymous (nearest) by default, or `container="sidebar"` to query a named one

### Named Containers

When you have nested containers and need to query a specific ancestor:

```tsx
<Container name="sidebar">
  <Box container="sidebar" r={{ 400: { padding: '4r' }, 600: { gap: '2r' } }} />
</Container>
```

### Expansion

The above expands to:

```tsx
<Box
  padding="2r"
  css={{
    '@container (min-width: 300px)': { padding: '3r' },
    '@container (min-width: 500px)': { padding: '4r', gap: '2r' },
  }}
/>
```

---

## Feasibility ✅

### Confirmed: Panda Accepts Arbitrary `@container` Rules

Panda's condition parser (`parseCondition`) accepts **any string starting with `@`**:

```typescript
// packages/core/src/parse-condition.ts
if (condition.startsWith('@')) {
  return parseAtRule(condition) // Parses as at-rule condition
}
```

This means:

- `@container (min-width: 300px)` → ✅ valid condition
- `@container card (min-width: 400px)` → ✅ valid condition
- `@container (min-width: 500px) and (max-width: 800px)` → ✅ valid condition

### Confirmed: Pattern Transforms Can Return Nested Conditions

Pattern transforms pass through `processStyleProps` → `processAtomic` → `hashStyleObject`, which uses `isCondition()` to detect conditions in the output object. This means a pattern can return:

```typescript
{
  padding: '2r',
  '@container (min-width: 300px)': { padding: '3r' },
}
```

And Panda will:

1. Extract the atomic class for `padding: 2r`
2. Extract the `@container` rule with nested styles
3. Generate the correct CSS output

### Feasibility: `container` + `r` as Two Props

**Yes, it works.** The concern ("constructing from 2 props") doesn't apply the way you might think.

Panda's pattern transform receives **all props in one call**. When you write `<Box container="sidebar" r={{ 400: {...} }} />`, the transform gets a single object:

```typescript
{ container: "sidebar", r: { 400: { padding: "4r" } }, ...otherProps }
```

There's no separate processing per prop. We destructure both, combine them to build the `@container` keys, and return one style object. The downstream pipeline (`hashStyleObject`, `processAtomic`) only sees the output—it doesn't care how we built it.

**How to achieve it:**

1. **Extend the box pattern** in `panda.config.ts` via `patterns.extend.box`. The box pattern comes from Panda's preset; we don't replace it, we extend with new `properties` and an overridden `transform`.

2. **Declare both props** in `properties` so they're schema-validated and **consumed** (not passed to the DOM). `container` and `r` are not valid HTML attributes—we must strip them in the transform. By listing them in `properties`, they're part of the pattern contract and won't leak.

3. **Single transform, single output** — we return one object with keys like `@container sidebar (min-width: 400px)`. Panda treats those as conditions and emits the CSS. The system (`src/system/`) is codegen'd from this config, so after `panda codegen`, `patterns/box.js` will contain our extended transform.

---

## Implementation

### Box Pattern with `r` and `container` Props

```typescript
// patterns/box.ts
import { definePattern } from '@pandacss/dev'

export const box = definePattern({
  properties: {
    r: { type: 'object' },
    container: { type: 'string' }, // Named container to query; absent = anonymous
  },
  transform(props) {
    const { r, container, ...rest } = props

    if (!r) return rest

    const prefix = container
      ? `@container ${container} (min-width:`
      : `@container (min-width:`

    for (const [bp, styles] of Object.entries(r)) {
      rest[`${prefix} ${bp}px)`] = styles
    }

    return rest
  },
})
```

---

## `<Container>` Primitive

Establishes a container query context:

```tsx
<Container>         {/* Anonymous, inline-size */}
<Container name="card">  {/* Named container */}
<Container density="compact">  {/* Scales r units */}
```

### Pattern Definition

```typescript
export const container = definePattern({
  properties: {
    name: { type: 'string' },
    type: { type: 'enum', value: ['inline-size', 'size', 'normal'] },
    density: { type: 'enum', value: ['compact', 'comfortable', 'spacious'] },
  },
  defaultValues: {
    type: 'inline-size',
  },
  transform(props) {
    const { name, type, density, ...rest } = props
    return {
      containerType: type,
      ...(name && { containerName: name }),
      ...(density && { 'data-density': density }),
      ...rest,
    }
  },
})
```

---

## Raw CSS — Escape Hatch

The `css` prop supports full container query syntax. Use it for the 2%: multi-container, max-width, aspect-ratio, style queries, etc.

```tsx
<Box
  css={{
    padding: '2r',
    '@container (min-width: 400px)': { padding: '3r' },
    '@container sidebar (min-width: 600px)': { padding: '4r' },
    '@container card (max-width: 300px)': { flexDirection: 'column' },
    '@container (min-width: 400px) and (max-width: 800px)': { gap: '2r' },
  }}
/>
```

---

## `r` Unit Tokens

Spacing tokens that respond to density context:

```typescript
// tokens/spacing.ts
export const spacing = {
  '0.5r': { value: 'calc(0.5 * var(--r))' },
  '1r': { value: 'var(--r)' },
  '1.5r': { value: 'calc(1.5 * var(--r))' },
  '2r': { value: 'calc(2 * var(--r))' },
  '3r': { value: 'calc(3 * var(--r))' },
  '4r': { value: 'calc(4 * var(--r))' },
  '6r': { value: 'calc(6 * var(--r))' },
  '8r': { value: 'calc(8 * var(--r))' },
}
```

### Global CSS

```typescript
globalCss: {
  ':root': {
    '--r-base': '16px',
    '--r-density': '1',
    '--r': 'calc(var(--r-base) * var(--r-density))',
  },
  '[data-density="compact"]': { '--r-density': '0.75' },
  '[data-density="comfortable"]': { '--r-density': '1' },
  '[data-density="spacious"]': { '--r-density': '1.25' },
}
```

---

## Key Learnings

### 1. Panda's Condition Detection is Permissive

```typescript
isCondition = (key: string) => {
  return this.has(key) || !!this.getRaw(key) || isBaseCondition(key)
}
```

- `this.has(key)` — checks predefined conditions
- `this.getRaw(key)` — parses arbitrary conditions (including any `@`-prefixed string)
- `isBaseCondition(key)` — just checks if key === `'base'`

### 2. Pattern Transforms Output → Atomic Processing

The flow is:

1. Pattern `transform()` returns style object
2. Goes through `processStyleProps()` → `processAtomic()` → `hashStyleObject()`
3. `hashStyleObject` traverses the object, detecting conditions with `isCondition()`
4. Conditions like `@container (min-width: 300px)` are recognized and extracted

### 3. CSS Variable Limitation Still Applies

```css
/* ❌ Does NOT work - CSS variables not allowed in container query values */
@container (min-width: var(--bp-sm)) {
}

/* ✅ Works - literal values only */
@container (min-width: 300px) {
}
```

This is why the `r` prop uses literal numbers, not token references.

### 4. Static Extraction Works

Since Panda extracts styles at build time:

- `r={{ 300: { padding: '3r' } }}` → extracted statically
- The literal `300` becomes `@container (min-width: 300px)` in CSS
- No runtime overhead

---

## Summary

| What We Ship            | What Users Do                                                     |
| ----------------------- | ----------------------------------------------------------------- |
| `<Container>` primitive | Establish container contexts (anonymous or named)                 |
| `r` prop on Box         | Mobile-first min-width breakpoints (`{ 300: {...}, 500: {...} }`) |
| `container` prop        | Query named container when nested (one container per element)     |
| `css` prop              | Full container query syntax for multi-container, max-width, etc.  |
| `r` unit tokens         | Spacing that respects density                                     |
| **Nothing predefined**  | Define their own breakpoints inline                               |

**r is a generalisation.** Streamlined for the 98%. Trade-offs accepted. Raw `css` for the rest.
