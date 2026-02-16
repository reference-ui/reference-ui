
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
   fontFace: {
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

## Implementation Architecture

### CLI Microbundle Pattern

The `font()` API follows the same architecture as `boxPattern` and `config`, requiring its own CLI microbundle system:

#### 1. Font Collector (`cli/panda/fontFace/`)

Similar to `boxPattern/`, this microbundle:
- **Collects** `font()` calls from `styled/font/` directory
- **Generates** `font.ts` with inlined pattern transforms
- **Bundles** font registration code at build time

#### 2. Collection Flow

```typescript
// styled/font/fonts.ts (user code)
font('sans', {
  value: '"Inter", ui-sans-serif, sans-serif',
  fontFace: { src: '...', fontWeight: '200 900' },
  weights: { thin: '200', normal: '400', bold: '700' },
  css: { letterSpacing: '-0.01em', fontWeight: 'normal' }
})

// CLI collects this and generates font.ts
```

**Build Process:**
1. Scan `styled/font/` for `font()` calls
2. Execute files via microbundle (like `collectEntryTemplate.ts`)
3. Extract font definitions and pattern transform sources
4. Generate `font.ts` with self-contained transforms

#### 3. Generated Output (`styled/font/font.ts`)

```typescript
// Generated by createFontSystem - do not edit manually

import { tokens } from '../api/tokens'
import { globalFontface } from '../api/globalFontface'
import { recipe } from '../api/recipe'
import { pattern } from '../api/pattern'

// Tokens registration
tokens({
  fonts: {
    sans: { value: '"Inter", ui-sans-serif, sans-serif' },
    serif: { value: '"Literata", ui-serif, serif' },
  },
  fontWeights: {
    'sans.thin': { value: '200' },
    'sans.normal': { value: '400' },
    'sans.bold': { value: '700' },
    'serif.thin': { value: '100' },
    'serif.normal': { value: '373' },
    // ...
  }
})

// @font-face rules
globalFontface({
  Inter: {
    src: 'url(...) format("woff2")',
    fontWeight: '200 900',
    fontDisplay: 'swap',
  },
  Literata: {
    src: 'url(...) format("woff2")',
    fontWeight: '200 900',
    fontDisplay: 'swap',
  }
})

// Recipe variants
recipe({
  fontStyle: {
    className: 'r_font',
    variants: {
      font: {
        sans: {
          fontFamily: 'sans',
          letterSpacing: '-0.01em',
          fontWeight: '400',
        },
        serif: {
          fontFamily: 'serif',
          letterSpacing: 'normal',
          fontWeight: '373',
        },
      }
    }
  }
})

// Pattern with self-contained transform
pattern({
  properties: {
    font: { type: 'string' as const },
    weight: { type: 'string' as const },
  },
  transform(props: Record<string, any>) {
    const { font, weight } = props
    
    // MUST be inlined - no closures allowed (Panda limitation)
    const FONT_PRESETS = {
      sans: { fontFamily: 'sans', letterSpacing: '-0.01em', fontWeight: '400' },
      serif: { fontFamily: 'serif', letterSpacing: 'normal', fontWeight: '373' },
    }
    
    const result: Record<string, any> = {}
    
    if (font) {
      Object.assign(result, FONT_PRESETS[font as keyof typeof FONT_PRESETS] || {})
    }
    
    if (weight) {
      result.fontWeight = weight
    }
    
    return result
  }
})
```

### Self-Contained Pattern Transforms

**Critical Constraint:** Panda pattern `transform()` functions cannot use external closures.

#### Why No Closures?

When Panda generates runtime pattern files (`styled-system/patterns/box.js`):
1. ✅ Our CLI bundles `panda.config.ts` correctly with all dependencies
2. ❌ Panda's codegen only serializes the `transform()` function body
3. ❌ External constants/imports are NOT included in generated runtime files

See [styled/api/patterns.md](../api/patterns.md) for detailed explanation.

#### Line Builder Pattern

The generated pattern transform must build the lookup inline:

```typescript
transform(props: Record<string, any>) {
  // Build lookup inside transform - included in runtime codegen
  const FONT_PRESETS = {
    sans: { fontFamily: 'sans', letterSpacing: '-0.01em', fontWeight: '400' },
    serif: { fontFamily: 'serif', letterSpacing: 'normal', fontWeight: '373' },
  }
  
  const WEIGHT_TOKENS = {
    'sans.thin': '200',
    'sans.normal': '400',
    'sans.bold': '700',
    'serif.thin': '100',
    'serif.normal': '373',
    // ...
  }
  
  const { font, weight } = props
  const result: Record<string, any> = {}
  
  if (font && FONT_PRESETS[font]) {
    Object.assign(result, FONT_PRESETS[font])
  }
  
  if (weight && WEIGHT_TOKENS[weight]) {
    result.fontWeight = WEIGHT_TOKENS[weight]
  }
  
  return result
}
```

#### Code Generation Strategy

The CLI generator must:
1. **Collect** all `font()` calls
2. **Build** the `FONT_PRESETS` and `WEIGHT_TOKENS` objects from collected data
3. **Inline** these objects directly into the `transform()` function source
4. **Stringify** the complete transform as a self-contained function

### Multi-API Orchestration

Each `font()` call triggers multiple styled/api functions:

```typescript
// User calls font() once
font('sans', { value: '...', fontFace: {...}, weights: {...}, css: {...} })

// Generates calls to:
tokens({...})           // Font family + weight tokens
globalFontface({...})   // @font-face rules  
recipe({...})          // fontStyle recipe variant
pattern({...})         // Box pattern extension (font + weight props)
```

**Implementation:**
- `font()` is defined in `styled/api/font.ts`
- Internally calls `extendFontCollector()` (similar to `extendBoxPattern`)
- CLI bundles and generates the orchestrated API calls

### File Structure

```
cli/panda/fontFace/
  ├── extendFontFace.ts         # font() calls this to register
  ├── initFontCollector.ts      # Initialize globalThis collector
  ├── collectEntryTemplate.ts   # Generate collection entry script
  ├── generateFontSystem.ts     # Generate font.ts with inlined transforms
  ├── createFontSystem.ts       # Main CLI entry (like createBoxPattern)
  └── index.ts

styled/api/
  └── font.ts                   # User-facing font() function

styled/font/
  ├── fonts.ts                  # User definitions (font() calls)
  ├── font.ts                   # Generated output
  └── index.ts                  # Exports
```

### Build Integration

Add to CLI build process (similar to box pattern):

```typescript
// cli/sync or build script
import { createFontSystem } from './panda/fontFace'

await createBoxPattern(coreDir)
await createFontSystem(coreDir)  // Add this
await createPandaConfig(coreDir)
```

## Design Validation

### ✅ Follows Existing Patterns
- Uses same collector/generator architecture as `boxPattern` and `config`
- Respects the "no closures" constraint for pattern transforms
- Integrates with existing styled/api functions

### ✅ Type Safety
- Font names and weights are known at build time
- TypeScript autocomplete works for `font` and `weight` props
- Generated types match registered fonts

### ✅ Single Source of Truth
- User defines fonts once with `font()`
- CLI generates all necessary integrations
- No manual synchronization between tokens, @font-face, recipes, and patterns

### ✅ Extensible
- New fonts added by calling `font()` again
- CLI regenerates on each build
- No breaking changes to existing patterns

### Potential Issues

#### Issue 1: Pattern Transform Size
If many fonts are registered, inlined `FONT_PRESETS` could be large.
- **Solution:** Generate separate lookup files if needed, but keep transform self-contained

#### Issue 2: Build Time
Additional CLI step for font collection/generation.
- **Mitigation:** Should be fast (similar speed to boxPattern), runs only on build/sync

#### Issue 3: Recipe Merging
Multiple `font()` calls must merge into single `fontStyle` recipe.
- **Solution:** CLI collects all variants and generates one recipe call

## Open Questions

1. **Weight prop syntax:** Should `weight` accept both short names (`"bold"`) and fully-qualified (`"sans.bold"`)?
   - Lean toward fully-qualified for explicitness
   - Short names could be ambiguous across fonts

2. **Default font styles:** Should `css` be required or optional?
   - Optional makes sense; fall back to font's default weight

3. **Font loading strategy:** Should we generate font preload hints?
   - Out of scope for v1; add later if needed

4. **React/JSX integration:** Does `<Box font="sans" weight="sans.bold">` work automatically?
   - Yes, pattern registration adds these props to box
   - Type definitions generated by Panda codegen