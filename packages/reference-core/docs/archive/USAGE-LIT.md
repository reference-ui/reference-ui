# Using Container Queries in Lit Components

## What is `patterns.extend.box`?

Panda CSS ships with built-in patterns like `box`, `flex`, `stack`, etc. These are helper functions that generate CSS classes.

**`patterns.extend.box`** means we're **extending/modifying** Panda's existing `box` pattern to add our responsive functionality (`r` and `container` props).

Without extending, the built-in `box()` only accepts standard CSS props:
```typescript
box({ padding: '2r', backgroundColor: 'blue.100' })
```

With our extension, it also accepts:
```typescript
box({ 
  padding: '2r',
  r: { 300: { padding: '4r' } },      // NEW: responsive breakpoints
  container: 'sidebar'                 // NEW: named container query
})
```

---

## How It Works in Lit Components

The patterns generate **CSS class names** that work in any framework, including Lit.

### Basic Usage

```typescript
/// <reference path="../styled/responsive.d.ts" />
import { box, container } from '../system/patterns/index.js'

class MyComponent extends LitElement {
  render() {
    // Returns a CSS class string
    const className = box({
      padding: '2r',
      r: {
        300: { padding: '4r' },
        500: { padding: '6r' },
      },
    })
    
    return html`<div class="${className}">Content</div>`
  }
}
```

### With Container Context

```typescript
render() {
  return html`
    <div class="${container({ name: 'sidebar' })}">
      <div class="${box({
        padding: '2r',
        container: 'sidebar',  // queries 'sidebar', not nearest
        r: { 400: { padding: '4r' } }
      })}">
        Content responds to sidebar width
      </div>
    </div>
  `
}
```

### Adding Responsive Styles to RefButton

```typescript
/// <reference path="../styled/responsive.d.ts" />
import { box } from '../system/patterns/index.js'

class RefButton extends LitElement {
  private getButtonStyles() {
    return box({
      padding: '2r',
      fontSize: '14px',
      backgroundColor: 'blue.500',
      r: {
        300: { padding: '3r', fontSize: '16px' },
        500: { padding: '4r', fontSize: '18px' },
      },
    })
  }
  
  render() {
    return html`<button class="${this.getButtonStyles()}">${this.label}</button>`
  }
}
```

---

## Available Patterns

### `box(props)`

Generates CSS class with optional container query responsiveness.

**Props:**
- Any CSS properties (padding, margin, backgroundColor, etc.)
- `r`: object with breakpoint keys (`{ 300: {...}, 500: {...} }`)
- `container`: string naming which container to query (optional)

**Example:**
```typescript
box({
  padding: '2r',
  backgroundColor: 'blue.100',
  r: {
    300: { padding: '4r', backgroundColor: 'green.100' },
    500: { padding: '6r', backgroundColor: 'yellow.100' },
  },
})
```

### `container(props)`

Establishes a container query context.

**Props:**
- `name`: string (optional) - name for nested components to query
- `type`: `'inline-size'` | `'size'` | `'normal'` (default: `'inline-size'`)
- `density`: `'compact'` | `'comfortable'` | `'spacious'` - scales `r` units

**Example:**
```typescript
container({ name: 'card', density: 'compact' })
```

---

## Density System

The `density` prop on `<Container>` scales all `r` units inside:

- **compact**: `0.75x` (tighter spacing)
- **comfortable**: `1x` (default)
- **spacious**: `1.25x` (looser spacing)

```typescript
// Compact layout
html`
  <div class="${container({ density: 'compact' })}">
    <div class="${box({ padding: '2r' })}">
      Padding is 2r * 0.75 = 1.5r worth of space
    </div>
  </div>
`
```

---

## TypeScript Setup

Add this at the top of any component file that uses `r` or `container` props:

```typescript
/// <reference path="../styled/responsive.d.ts" />
```

This augments Panda's generated types with our responsive props.

## Works Everywhere

These patterns work in **any Lit component** because they just return CSS class strings. No framework-specific logic.

```typescript
/// <reference path="../styled/responsive.d.ts" />
import { box } from '../system/patterns/index.js'

render() {
  return html`<div class="${box({ padding: '2r' })}">Content</div>`
}
```

---

## See Also

- `Card.ts` - Full example component
- `responsive.md` - Complete API documentation
- `responsive.ts` - Pattern implementation
