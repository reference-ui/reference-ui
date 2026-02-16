
# Font API Design

Clean API that combines font tokens, @font-face rules, and recipe variants.

## Proposed API

```typescript
import { font } from '@reference-ui/core'

// Define a complete font system in one call
font('sans', {
  // Font-family value - what the 'sans' token resolves to
  value: '"Inter", ui-sans-serif, sans-serif',
  
  // @font-face rules - can be single or array
g  fontFace: {
    src: 'url(...)',
    fontWeight: '200 900',
    sizeAdjust: '104%',
    descentOverride: '47%',
  },
  
  // Named font weights for this font
  weights: {
    thin: '200',
    light: '300',
    normal: '400',    // CSS keyword
    semibold: '600',
    bold: '700',      // CSS keyword
    black: '900',
  },
  
  css: {
    letterSpacing: '-0.01em',
    fontWeight: 'normal',
  }
})

font('serif', {
  value: '"Literata", ui-serif, serif',
  fontFace: {
    src: 'url(...)',
    fontWeight: '200 900',
    sizeAdjust: '104%',
    descentOverride: '47%',
  },
  weights: {
    thin: '100',
    light: '300',
    normal: '373',    // custom for this font
    semibold: '600',
    bold: '700',
    black: '900',
  },
  css: {
    letterSpacing: 'normal',
    fontWeight: 'normal',
  }
})

// Multiple @font-face variants (regular + italic)
font('display', {
  value: '"Playfair Display", serif',
  fontFace: [
    {
      src: 'url(...) format("woff2")',
      fontWeight: '400',
      fontStyle: 'normal',
    },
    {
      src: 'url(...) format("woff2")',
      fontWeight: '400',
      fontStyle: 'italic',
    }
  ],
  weights: {
    normal: '400',
    bold: '700',
  },
  css: {
    letterSpacing: '0.02em',
    fontWeight: 'normal',
  }
})
```

## What it does internally

1. **Registers font token** via `tokens({ fonts: { sans: { value: '"Inter", ...' } } })`
2. **Registers font weight tokens** via `tokens({ fontWeights: { 'sans.light': '300', 'sans.normal': '400', 'sans.bold': '700', ... } })`
3. **Adds @font-face rules** to global CSS (via `globalCss` in Panda config)
4. **Creates recipe variant** for the font (adds `font: 'sans'` variant to `fontStyle` recipe)

## Usage after registration

```typescript
// In components
css({ font: 'sans' })  // Applies fontFamily + default styles

// Or just the token
css({ fontFamily: 'sans' })  // Just the font-family

// Use named weights
css({ 
  fontFamily: 'sans',
  fontWeight: 'sans.semibold'  // Uses the registered weight
})
```

## Benefits

- Single function call per font
- Co-locates all font config
- Automatically wires up tokens, @font-face, and recipes
- Clean, declarative API

## Pattern Integration

The `font()` function must also register a Panda **pattern** to enable JSX props for fonts and weights.

### Registered Pattern

```typescript
// font() internally registers a pattern that adds these properties:
{
  font: { type: 'token', token: 'fonts' },
  weight: { type: 'token', token: 'fontWeights' }
}
```

### Usage with Pattern

```typescript
// After calling font('sans', {...})
// Use as JSX props on any Panda component:

<Box font="sans" weight="semibold">
  Text with sans font and semibold weight
</Box>

<div className={css({ font: 'sans', weight: 'sans.bold' })}>
  Also works in css() function
</div>
```

### What the Pattern Does

1. **`font` prop** → maps to `fontFamily` token + applies recipe styles
2. **`weight` prop** → maps to `fontWeight` token (e.g., `'sans.semibold'`)
3. **Type-safe** → only registered fonts and weights are valid
4. **Automatic styles** → `font="sans"` applies letter-spacing, default weight, etc.

### Complete Registration Flow

When you call `font('sans', {...})`, it:
1. Registers font token: `tokens({ fonts: { sans: { value: '...' } } })`
2. Registers weight tokens: `tokens({ fontWeights: { 'sans.thin': '100', ... } })`
3. Adds @font-face rules to globalCss
4. Creates recipe variant: `fontStyle.variants.font.sans`
5. **Registers pattern properties**: `font` and `weight` props for JSX