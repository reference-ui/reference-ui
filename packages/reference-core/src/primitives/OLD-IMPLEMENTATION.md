# Old Primitive Implementation: styled.tag + box.raw

This document describes the previous implementation approach for primitives that used `styled[tag]` directly combined with `box.raw()` to spread the box pattern. This was replaced in commit `faaff81` ("shaky but more correct patterns").

## Why It May Be More Robust

The old approach had several advantages:

1. **Direct styled component usage**: Using `styled[tag]` leverages Panda's built-in styling system directly
2. **Explicit pattern composition**: The box pattern was explicitly spread using `box.raw()`, making it clear what's happening
3. **Simple prop splitting**: Used `splitProps` to cleanly separate box pattern props (`r`, `container`) from regular props
4. **Better ref types**: Each primitive got correct TypeScript ref types for its specific element

## Implementation Details

### Core Approach (commit 9fdd25b)

Each primitive was generated as:

```tsx
const StyledDiv = styled['div']
export const Div = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledDiv ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'div'> & React.RefAttributes<PrimitiveElement<'div'>>>
```

### Key Components

1. **styled[tag]**: Creates a Panda-styled component for the specific HTML tag
2. **splitProps**: Separates box pattern props from other props
3. **box.raw()**: Generates the CSS classes/styles for the box pattern
4. **forwardRef**: Maintains proper ref forwarding to the DOM element

### Types

```typescript
/**
 * Props for a primitive component.
 * - Extends the native HTML element's props
 * - Includes Panda's style props (margin, padding, color, etc.)
 * - Includes r and container from the box pattern (container queries)
 * - Explicitly OMITS 'as' - Reference UI primitives are not polymorphic
 */
export type PrimitiveProps<T extends keyof React.JSX.IntrinsicElements> =
  DistributiveOmit<HTMLStyledProps<T>, 'as'> & {
    r?: ResponsiveBreakpoints
    container?: string | boolean
  }

export type PrimitiveElement<
  T extends keyof React.JSX.IntrinsicElements
> = React.ComponentRef<T>
```

## Generation Script

The `generate-primitives.cjs` script was simpler and more straightforward:

```javascript
#!/usr/bin/env node
/**
 * Generates src/primitives/index.tsx with explicit primitive components.
 * Each primitive = styled[tag] composed with box pattern (r, container).
 * Simple composition, no createElement.
 */

const fs = require('fs')
const path = require('path')

// Read and parse tags from tags.ts
const tagsPath = path.join(__dirname, '../src/primitives/tags.ts')
const tagsContent = fs.readFileSync(tagsPath, 'utf8')
const match = tagsContent.match(/\[([\s\S]*?)\]\s+as const/)
if (!match) throw new Error('Could not parse TAGS from tags.ts')
const HTML_TAGS = match[1]
  .split(',')
  .map((s) => s.replace(/['"]/g, '').trim())
  .filter(Boolean)

function toPascalCase(tag) {
  if (tag.length === 0) return tag
  if (tag.length === 1) return tag.toUpperCase()
  return tag.charAt(0).toUpperCase() + tag.slice(1)
}

function escapeTag(tag) {
  if (tag === 'object') return 'Obj'
  if (tag === 'var') return 'Var'
  return toPascalCase(tag)
}

const outDir = path.join(__dirname, '../src/primitives')
const outPath = path.join(outDir, 'index.tsx')

const header = `/**
 * Reference UI Primitives (generated - do not edit)
 * Run: node scripts/generate-primitives.cjs
 *
 * styled[tag] + box pattern (r, container). Simple composition.
 */

import * as React from 'react'
import { forwardRef } from 'react'
import { splitProps } from '../system/helpers.js'
import { box } from '../system/patterns/box.js'
import { styled } from '../system/jsx/index.js'
import type { PrimitiveElement, PrimitiveProps } from './types.js'

export { TAGS as HTML_TAGS, type Tag as HtmlTag } from './tags.js'
export type { PrimitiveElement, PrimitiveProps } from './types.js'

`

function genPrimitive(tag, exportName) {
  const styledVar = `Styled${exportName}`
  return [
    `const ${styledVar} = styled['${tag}']`,
    `export const ${exportName} = forwardRef((props, ref) => {`,
    `  const [p, r] = splitProps(props, ['r', 'container'])`,
    `  return <${styledVar} ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />`,
    `}) as React.ForwardRefExoticComponent<PrimitiveProps<'${tag}'> & React.RefAttributes<PrimitiveElement<'${tag}'>>>`,
    '',
  ].join('\n')
}

const lines = [header]
for (const tag of HTML_TAGS) {
  const exportName = escapeTag(tag)
  lines.push(genPrimitive(tag, exportName))
}

fs.writeFileSync(outPath, lines.join('\n'), 'utf8')
console.log('Generated', outPath)
```

## Example Generated Output

```tsx
const StyledDiv = styled['div']
export const Div = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledDiv ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'div'> & React.RefAttributes<PrimitiveElement<'div'>>>

const StyledSpan = styled['span']
export const Span = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledSpan ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'span'> & React.RefAttributes<PrimitiveElement<'span'>>>

const StyledButton = styled['button']
export const Button = forwardRef((props, ref) => {
  const [p, r] = splitProps(props, ['r', 'container'])
  return <StyledButton ref={ref} {...(box.raw(p as Parameters<typeof box.raw>[0]) as object)} {...(r as object)} />
}) as React.ForwardRefExoticComponent<PrimitiveProps<'button'> & React.RefAttributes<PrimitiveElement<'button'>>>
```

## How to Reimplement

### 1. Update types.ts

The `types.ts` file needs to include `r` and `container` props:

```typescript
import type * as React from 'react'
import type { HTMLStyledProps } from '../system/types/jsx.js'
import type { DistributiveOmit } from '../system/types/system-types.js'
import type { ResponsiveBreakpoints } from '../styled/responsive'

export type PrimitiveProps<T extends keyof React.JSX.IntrinsicElements> =
  DistributiveOmit<HTMLStyledProps<T>, 'as'> & {
    r?: ResponsiveBreakpoints
    container?: string | boolean
  }

export type PrimitiveElement<
  T extends keyof React.JSX.IntrinsicElements
> = React.ComponentRef<T>
```

### 2. Replace generate-primitives.cjs

Replace the current script with the version shown above that:
- Imports `styled`, `splitProps`, and `box` from system
- Generates `styled[tag]` for each component
- Uses `splitProps` to separate box pattern props
- Spreads `box.raw()` result along with remaining props

### 3. Delete createPrimitive.tsx

The old approach doesn't use a factory function - each primitive is generated inline.

### 4. Update css/ directory (optional)

With the old approach, the `css/` directory with style files (`h1.style.ts`, etc.) became unnecessary since primitives relied on the box pattern instead of recipes. You could:
- Keep them for semantic styling by importing and applying them manually
- Remove them if going back to pure box pattern approach

### 5. Regenerate

```bash
node packages/reference-core/scripts/generate-primitives.cjs
```

## Differences from Current Implementation

### Old Approach (styled.tag + box.raw)
- ✅ Direct Panda styled component usage
- ✅ Explicit prop splitting with `splitProps`
- ✅ Box pattern spread via `box.raw()`
- ✅ Simple, transparent composition
- ❌ No recipe support per-tag (h1, p, etc.)
- ❌ Larger generated file (each primitive is ~5 lines)

### Current Approach (createPrimitive factory)
- ✅ Support for per-tag recipes (h1Style, pStyle, etc.)
- ✅ Smaller generated file (one line per primitive)
- ✅ Factory function reduces duplication
- ❌ Less explicit about what's happening
- ❌ More abstraction layers
- ❌ Potential issues with pattern spreading (why it's "shaky")

## When to Use Old Approach

Consider reverting to the old approach if:

1. **Recipe complexity is causing issues**: The current approach tries to merge recipes with patterns, which can be "shaky"
2. **You prefer explicit composition**: Seeing `splitProps` and `box.raw()` makes the data flow clearer
3. **Debugging is difficult**: More abstraction = harder to trace issues
4. **You don't need per-tag recipes**: If semantic styles (h1, p) are handled elsewhere

## When to Keep Current Approach

Keep the current approach if:

1. **Recipes are working well**: Per-tag styling via recipes is valuable
2. **Generated file size matters**: Current approach is more compact
3. **You like the factory pattern**: Less code to look at in the generated file
4. **The "shaky" issues can be resolved**: Maybe the pattern spreading can be fixed

## Commit References

- **Old approach**: commit `9fdd25b` and earlier
- **Transition commit**: `faaff81` ("shaky but more correct patterns")
- **Current approach**: commit `faaff81` and later
