# `<ref-box>` - Responsive Container Primitive

Low-level building block for container-query responsive layouts.

## Features

- **Container queries** - responds to container width, not viewport
- **Density-aware** - `r` units scale with parent density
- **Type-safe** - full TypeScript support with bundled types
- **Style props** - common CSS properties as attributes
- **Escape hatch** - raw `css` prop for advanced cases

---

## Basic Usage

### HTML

```html
<ref-box padding="2r">
  Content here
</ref-box>
```

### With Responsive Breakpoints (Programmatic)

```typescript
import { RefBox } from '@reference-ui/core'

const box = document.createElement('ref-box')
box.padding = '2r'
box.r = {
  300: { padding: '4r' },
  500: { padding: '6r', backgroundColor: 'blue.100' },
}
document.body.appendChild(box)
```

### With Named Container

```html
<div style="container-name: sidebar; container-type: inline-size;">
  <ref-box 
    padding="2r"
    data-container="sidebar"
  >
    Responds to sidebar width
  </ref-box>
</div>
```

---

## Props

### Responsive Props

| Prop | Type | Description |
|------|------|-------------|
| `r` | `ResponsiveBreakpoints` | Container query breakpoints (programmatic only) |
| `container` | `string` | Named container to query (optional) |
| `css` | `SystemStyleObject` | Raw Panda CSS object (escape hatch) |

### Style Props

Common CSS properties available as attributes:

| Prop | CSS Property |
|------|--------------|
| `padding` | `padding` |
| `margin` | `margin` |
| `backgroundColor` | `background-color` |
| `color` | `color` |
| `display` | `display` |
| `flexDirection` | `flex-direction` |
| `gap` | `gap` |
| `width` | `width` |
| `height` | `height` |
| `borderRadius` | `border-radius` |
| `border` | `border` |

---

## TypeScript Usage

Types are automatically bundled with `@reference-ui/core`:

```typescript
import type { RefBoxProps, ResponsiveBreakpoints } from '@reference-ui/core'

const breakpoints: ResponsiveBreakpoints = {
  300: { padding: '4r' },
  500: { padding: '6r' },
}

const box = document.createElement('ref-box') as RefBox
box.r = breakpoints
```

---

## Examples

### Responsive Card

```html
<div style="container-type: inline-size;">
  <ref-box
    padding="2r"
    backgroundColor="gray.100"
    borderRadius="md"
  >
    <h3>Card Title</h3>
    <p>Card content</p>
  </ref-box>
</div>
```

With JS:
```typescript
const card = document.createElement('ref-box')
card.padding = '2r'
card.backgroundColor = 'gray.100'
card.r = {
  300: { padding: '4r', display: 'flex', gap: '2r' },
  500: { padding: '6r', gap: '4r' },
}
```

### Nested Containers

```html
<div style="container-name: page; container-type: inline-size;">
  <div style="container-name: sidebar; container-type: inline-size;">
    <ref-box 
      padding="1r"
      data-container="page"
    >
      Responds to page container, not sidebar
    </ref-box>
  </div>
</div>
```

### With Density

```html
<div data-density="compact" style="container-type: inline-size;">
  <ref-box padding="2r">
    Padding is 2r * 0.75 (compact density)
  </ref-box>
</div>

<div data-density="spacious" style="container-type: inline-size;">
  <ref-box padding="2r">
    Padding is 2r * 1.25 (spacious density)
  </ref-box>
</div>
```

---

## Advanced: Raw CSS Prop

For cases not covered by style props or `r`:

```typescript
const box = document.createElement('ref-box')
box.css = {
  padding: '2r',
  '@container (max-width: 300px)': {
    display: 'none',
  },
  '@container (orientation: portrait)': {
    flexDirection: 'column',
  },
  '@supports (container-type: inline-size)': {
    containerType: 'inline-size',
  },
}
```

---

## How It Works

`<ref-box>` is a Lit web component that:

1. Collects all props (style props, `r`, `container`, `css`)
2. Passes them to Panda's `box()` pattern
3. Receives a CSS class name string
4. Renders a `<div>` with that class and a `<slot>` for content

The responsive styles are generated at build time by Panda, resulting in zero runtime overhead for container queries.

---

## Comparison to Raw Panda

### With `<ref-box>` (declarative)

```html
<ref-box padding="2r" backgroundColor="blue.100">
  Content
</ref-box>
```

### With raw Panda (programmatic)

```typescript
/// <reference path="../styled/responsive.d.ts" />
import { box } from '@reference-ui/core'

const className = box({ padding: '2r', backgroundColor: 'blue.100' })
const div = document.createElement('div')
div.className = className
div.textContent = 'Content'
```

Use `<ref-box>` for HTML/templates. Use `box()` directly in Lit `render()` methods.

---

## See Also

- `responsive.md` - Full responsive system documentation
- `USAGE-LIT.md` - Using patterns in Lit components
- `Card.ts` - Example component using responsive patterns
