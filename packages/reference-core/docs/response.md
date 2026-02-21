# Reference UI: Container Query & Responsive Unit System

## Philosophy

1. **All spacing uses `r` units** — no raw numbers, no magic values
2. **Context-aware, not viewport-aware** — container queries over media queries
3. **General purpose, low level** — no predefined breakpoints, users define their own
4. **Components are self-contained** — embeddable, nest-safe, MFE-ready

---

# API

## `<Container>`

Establishes a container query context. Nothing more.

```tsx
import { Container, Box } from 'reference-ui'

// Anonymous container
<Container>
  <Box css={{ '@container (min-width: 400px)': { padding: '3r' } }} />
</Container>

// Named container
<Container name="card">
  <Box css={{ '@container card (min-width: 400px)': { padding: '3r' } }} />
</Container>

// With density (scales all `r` units in subtree)
<Container density="compact">
  <Box p="2r" />  {/* Uses 0.75x scale */}
</Container>
```

### Props

| Prop      | Type                                       | Default         | Description                         |
| --------- | ------------------------------------------ | --------------- | ----------------------------------- |
| `name`    | `string`                                   | —               | Container name for targeted queries |
| `type`    | `'inline-size' \| 'size' \| 'normal'`      | `'inline-size'` | Container type                      |
| `density` | `'compact' \| 'comfortable' \| 'spacious'` | —               | Scales `r` units in subtree         |

---

## `cq()` — Container Query Helper

Generates `@container` CSS objects. Pure function, no magic.

```tsx
import { Container, Box, cq } from 'reference-ui'

// 1. Establish the container with <Container name="...">
// 2. Query it with cq('...', { breakpoints })

<Container name="card">
  <Box css={cq('card', {
    400: { padding: '3r' },
    600: { padding: '4r', gap: '2r' },
  })} />
</Container>

// cq('card', {...}) expands to:
// {
//   '@container card (min-width: 400px)': { padding: '3r' },
//   '@container card (min-width: 600px)': { padding: '4r', gap: '2r' },
// }

// Anonymous container (no name)
<Container>
  <Box css={cq(null, {
    400: { padding: '3r' },
  })} />
</Container>
```

---

## Planned: Inline Responsive Props

The cleaner API we're aiming for:

```tsx
<Container>
  <Box sm={{ padding: '2r' }} md={{ padding: '3r' }} lg={{ padding: '5r' }} />
</Container>
```

Where `sm`, `md`, `lg` are **container query conditions** (not viewport).

This requires:

1. User defines container breakpoints in their config
2. Those become available as props on all styled components
3. The `<Container>` establishes the query context

**User's config:**

```ts
// panda.config.ts
export default defineConfig({
  conditions: {
    extend: {
      // Container query conditions (user-defined sizes)
      sm: '@container (min-width: 300px)',
      md: '@container (min-width: 500px)',
      lg: '@container (min-width: 700px)',
    },
  },
})
```

**Usage:**

```tsx
<Container>
  <Box
    padding="2r"
    sm={{ padding: '3r' }}
    md={{ padding: '4r' }}
    lg={{ padding: '5r', gap: '2r' }}
  />
</Container>
```

This is more ergonomic than `cq()` for common cases.

### Signature

```ts
function cq(
  name: string | null,
  styles: Record<number, CSSProperties>
): Record<string, CSSProperties>
```

---

## `fluid()` — Continuous Scaling

Generates `clamp()` for smooth scaling based on container size.

```tsx
import { fluid } from 'reference-ui'

;<Box
  gap={fluid('1r', '3r')} // Scales from 1r to 3r
  fontSize={fluid('14px', '18px')}
/>
```

### Signature

```ts
function fluid(min: string, max: string): string
// Returns: clamp(min, calc(...), max)
```

---

## `r` Unit Tokens

Spacing tokens that respond to density context.

```tsx
<Box p="2r" gap="1r" />

// Available tokens: 0.5r, 1r, 1.5r, 2r, 3r, 4r, 6r, 8r, ...
```

Density affects all `r` units in a subtree:

```tsx
<Container density="compact">   {/* r * 0.75 */}
<Container density="comfortable"> {/* r * 1.0 */}
<Container density="spacious">  {/* r * 1.25 */}
```

---

## User-Defined Conditions

Users define their own breakpoints in their project config:

```ts
// User's panda.config.ts
export default defineConfig({
  conditions: {
    extend: {
      '@card/sm': '@container card (min-width: 300px)',
      '@card/md': '@container card (min-width: 500px)',
      '@card/lg': '@container card (min-width: 700px)',
    },
  },
})
```

Then use with Panda's responsive syntax:

```tsx
<Box p={{ base: '2r', '@card/sm': '3r', '@card/md': '4r' }} />
```

---

# Examples

## Basic Usage

```tsx
import { Container, Box, cq } from 'reference-ui'

function Card() {
  return (
    <Container name="card">
      <Box
        p="2r"
        css={cq('card', {
          400: { padding: '3r' },
          600: { padding: '4r' },
        })}
      >
        <CardContent />
      </Box>
    </Container>
  )
}
```

## Nested Containers

```tsx
<Container name="page">
  <Header />

  <Container name="sidebar" density="compact">
    <Nav
      css={cq('sidebar', {
        200: { flexDirection: 'row' },
      })}
    />
  </Container>

  <Container name="content">
    <Grid
      css={cq('content', {
        600: { gridTemplateColumns: 'repeat(2, 1fr)' },
        900: { gridTemplateColumns: 'repeat(3, 1fr)' },
      })}
    />
  </Container>
</Container>
```

## Raw CSS (Always Works)

```tsx
<Container name="card">
  <Box
    css={{
      '@container card (min-width: 400px)': { padding: '3r' },
      '@container card (min-width: 600px) and (max-width: 800px)': {
        padding: '4r',
        gap: '2r',
      },
    }}
  />
</Container>
```

---

# Implementation Details

## `<Container>` Pattern

```ts
// patterns/container.ts
import { definePattern } from '@pandacss/dev'

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

## `cq()` Helper

```ts
// lib/cq.ts
type ContainerStyles = Record<number | string, Record<string, unknown>>

export function cq(
  name: string | null,
  styles: ContainerStyles
): Record<string, Record<string, unknown>> {
  const result: Record<string, Record<string, unknown>> = {}

  for (const [breakpoint, styleObj] of Object.entries(styles)) {
    const query = name
      ? `@container ${name} (min-width: ${breakpoint}px)`
      : `@container (min-width: ${breakpoint}px)`
    result[query] = styleObj
  }

  return result
}
```

---

## `fluid()` Utility

```ts
// lib/fluid.ts
export function fluid(min: string, max: string): string {
  // Linear interpolation between min and max based on container width
  // Uses 100cqi (container query inline size)
  return `clamp(${min}, calc(${min} + (${max} - ${min}) * ((100cqi - 320px) / (1024px - 320px))), ${max})`
}
```

---

## `r` Unit Tokens

```ts
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

---

## Global CSS (Base Variables)

```ts
// globalCss
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

## Full Preset Example

```ts
// panda.config.ts (Reference UI preset)
import { definePreset } from '@pandacss/dev'

export const referencePreset = definePreset({
  theme: {
    tokens: {
      spacing: {
        '0.5r': { value: 'calc(0.5 * var(--r))' },
        '1r': { value: 'var(--r)' },
        '1.5r': { value: 'calc(1.5 * var(--r))' },
        '2r': { value: 'calc(2 * var(--r))' },
        '3r': { value: 'calc(3 * var(--r))' },
        '4r': { value: 'calc(4 * var(--r))' },
        '6r': { value: 'calc(6 * var(--r))' },
        '8r': { value: 'calc(8 * var(--r))' },
      },
    },
    // NO predefined containerNames or containerSizes
    // Users define their own
  },
  patterns: {
    extend: {
      container: {
        description: 'Establishes a container query context',
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
      },
    },
  },
  // NO predefined conditions — users define their own
  globalCss: {
    ':root': {
      '--r-base': '16px',
      '--r-density': '1',
      '--r': 'calc(var(--r-base) * var(--r-density))',
    },
    '[data-density="compact"]': { '--r-density': '0.75' },
    '[data-density="comfortable"]': { '--r-density': '1' },
    '[data-density="spacious"]': { '--r-density': '1.25' },
  },
})
```

---

# Summary

| What We Ship            | What Users Do                     |
| ----------------------- | --------------------------------- |
| `<Container>` primitive | Establish container contexts      |
| `cq()` helper           | Generate `@container` CSS easily  |
| `fluid()` helper        | Continuous scaling with `clamp()` |
| `r` unit tokens         | Spacing that respects density     |
| Density modifiers       | Scale entire subtrees             |
| **Nothing predefined**  | Define their own breakpoints      |

**No `sm`, `md`, `lg`. No opinionated tokens. Just primitives.**
