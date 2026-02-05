# Migration Plan: Lit Web Components → React First

## Current State

- **Components:** Lit web components (`RefButton`, `RefBox`, `RefCard`, `RefResponsiveExample`)
- **Styling:** Panda CSS patterns (`box()`, `container()`) + rhythm utilities
- **Responsive:** Container query system with `r` prop via pattern transforms
- **Build:** `tsdown` for bundling, no JSX framework in Panda config

## Goal

Switch to **React-first** using Panda's generated JSX primitives while preserving:
- The responsive container query system (`r` prop, `container` prop)
- The rhythm unit system (`r` units + density)
- All work in `src/styled/` (tokens, responsive patterns, utilities)

---

## Benefits of React First

1. **Better static extraction** - `<Box r={{ 300: {...} }} />` works with inline object literals
2. **Panda-native** - Use generated JSX components instead of custom Lit elements
3. **Type safety** - Full TypeScript support for all props automatically
4. **Ecosystem** - Better React tooling, devtools, libraries
5. **Simpler** - No manual `box()` calls in render methods

---

## Migration Steps

### 1. Enable React in Panda Config

**File:** `packages/reference-core/panda.config.ts`

**Changes:**
```typescript
export default defineConfig({
  // ... existing config
  jsxFramework: 'react',  // ADD THIS
  // Keep all existing patterns, utilities, theme
})
```

**Action:** Run `panda codegen` to generate React JSX components in `src/system/jsx/`

**Result:**
- `src/system/jsx/Box.tsx` with `r` and `container` props
- `src/system/jsx/Container.tsx` with `name`, `type`, `density` props
- Full TypeScript types for all props

---

### 2. Update Package Dependencies

**File:** `packages/reference-core/package.json`

**Changes:**
- Move `react` from `devDependencies` to `peerDependencies`
- Add `react-dom` as peer dependency
- Keep `lit` for backward compatibility (optional)

```json
{
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  }
}
```

**Rationale:** Peer deps = consumers provide React; we don't bundle it.

---

### 3. Update Exports

**File:** `packages/reference-core/src/entry/index.ts`

**Changes:**
```typescript
// Export Panda-generated JSX primitives
export { Box } from '../system/jsx/box.js'
export { Container } from '../system/jsx/container.js'
export { Flex, Stack, HStack, VStack } from '../system/jsx/index.js'

// Export patterns for advanced users
export { box, container } from '../system/patterns/index.js'
export { css } from '../system/css/index.js'

// Types
export type { BoxProps } from '../system/jsx/box.js'
export type { ContainerProps } from '../system/jsx/container.js'
export type { SystemStyleObject } from '../system/types/index.js'
export type { ResponsiveBreakpoints } from '../styled/responsive.d.js'

// Keep tokens/theme
export { tokens, defaultTheme, defaultStaticCss } from '../styled/index.js'
```

**Remove:**
- Lit-based components (`RefBox`, `RefCard`, `RefButton`, `RefResponsiveExample`)
- Or move to a separate `@reference-ui/lit` package

---

### 4. Create React Component Examples

**File:** `packages/reference-core/src/components/Button.tsx` (new React version)

```typescript
import { forwardRef } from 'react'
import { css } from '../system/css/index.js'
import type { SystemStyleObject } from '../system/types/index.js'

export interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'small' | 'medium' | 'large'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'medium', className, ...props }, ref) => {
    const buttonClass = css({
      padding: '3r',
      backgroundColor: 'blue.500',
      color: 'white',
      borderRadius: 'md',
      // ... variant/size logic
    })

    return <button ref={ref} className={buttonClass} {...props} />
  }
)
```

**File:** `packages/reference-core/src/components/ResponsiveExample.tsx`

```typescript
import { Box } from '../system/jsx/box.js'
import { Container } from '../system/jsx/container.js'

export function ResponsiveExample() {
  return (
    <Container 
      style={{ 
        border: '2px solid #666',
        resize: 'horizontal',
        overflow: 'auto',
        maxWidth: '100%',
      }}
    >
      <h2>Resize this container →</h2>
      
      <Box
        padding="2r"
        backgroundColor="#ef4444"
        color="white"
        r={{
          300: { padding: '4r', backgroundColor: '#22c55e' },
          500: { padding: '6r', backgroundColor: '#3b82f6' },
          700: { padding: '8r', backgroundColor: '#a855f7' },
        }}
      >
        <h3>Responsive Box</h3>
        <p>Container-aware responsive design works!</p>
      </Box>
    </Container>
  )
}
```

---

### 5. Update Build Process

**File:** `packages/reference-core/tsconfig.json`

**Changes:**
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",  // Modern JSX transform
    "target": "es2020",  // Can upgrade from es2015
    // ... rest stays same
  }
}
```

**File:** `packages/reference-core/tsdown.config.ts`

Check if tsdown needs JSX config updates for React output.

---

### 6. Update Reference App

**File:** `packages/reference-app/src/App.tsx`

**Changes:**
```typescript
import { Box, Container } from '@reference-ui/core'
import '@reference-ui/core/styles.css'

export default function App() {
  return (
    <Container density="comfortable">
      <Box padding="4r" backgroundColor="gray.50">
        <h1>Reference UI - React First</h1>
        
        <Box
          padding="2r"
          r={{
            400: { padding: '4r', display: 'flex', gap: '2r' },
            600: { padding: '6r' },
          }}
        >
          Container-aware responsive box
        </Box>
      </Box>
    </Container>
  )
}
```

---

### 7. Documentation Updates

**Files to create/update:**

1. **`docs/REACT-USAGE.md`** - How to use the React primitives
2. **`docs/responsive.md`** - Update examples to use `<Box>` instead of `box()`
3. **`README.md`** - Update with React-first messaging
4. **`docs/MIGRATION-FROM-LIT.md`** - For anyone who was using the Lit components

**Archive:**
- Move `docs/USAGE-LIT.md` to `docs/archive/` or delete
- Move `docs/REF-BOX.md` to `docs/archive/`

---

## What We Keep (No Changes)

✅ **`src/styled/responsive.ts`** - Pattern definitions  
✅ **`src/styled/responsive.d.ts`** - Type augmentations  
✅ **`src/styled/rhythm.ts`** - Rhythm utilities  
✅ **`src/styled/colors.ts`** - Color tokens  
✅ **`src/styled/index.ts`** - Theme & tokens  
✅ **`src/system/`** - Panda codegen output (will be regenerated)  
✅ **Container query system** - Works the same, just used via JSX now

---

## Migration Risks

### Low Risk
- Panda's React JSX generation is stable and well-tested
- Pattern transforms stay the same (just consumed differently)
- Build process should be straightforward

### Medium Risk
- Type definitions might need adjustment for React-specific types
- Bundle size could increase if React becomes a hard dependency
- Need to verify `tsdown` works well with React/JSX output

### Unknown
- Whether inline `r={{ ... }}` object literals actually extract properly in all cases
- Need to test with nested objects and various prop combinations

---

## Testing Plan

After migration:

1. **Static extraction test:**
   - Create components with inline `r` props
   - Run `panda codegen && panda`
   - Verify `@container` rules in `styles.css`

2. **Runtime test:**
   - Run dev server
   - Verify responsive behavior works
   - Test density switching
   - Test named vs anonymous containers

3. **Type safety test:**
   - Verify TypeScript accepts `r` prop
   - Verify autocomplete works for breakpoint values
   - Verify `container` prop types

4. **Build test:**
   - Build reference-core
   - Build reference-app consuming it
   - Verify types are bundled correctly

---

## Rollback Plan

If React doesn't work as expected:

1. Revert `jsxFramework` removal
2. Keep Lit components
3. Document that responsive styles require `box()` pattern calls
4. Consider `staticCss` approach for common breakpoints

---

## Timeline Estimate

- **Config changes:** 15 min
- **Component migration:** 1-2 hours (depends on component count)
- **Testing:** 1-2 hours
- **Documentation:** 1-2 hours
- **Total:** 4-6 hours of focused work

---

## Open Questions

1. Do we want to support **both** React and Lit, or go React-only?
2. If React-only, what about existing Lit users (if any)?
3. Should we create a `@reference-ui/lit` package to keep Lit support?
4. Do we need SSR support (React Server Components, etc.)?

---

## Recommendation

**Go React-first** for the primitives (`Box`, `Container`, etc.). The Panda integration is designed for it, static extraction will be more reliable, and the ecosystem is larger.

**Keep the pattern functions** (`box()`, `container()`) exported for advanced users or framework-agnostic usage.

**Document the trade-offs** - React-first means React dependency, but better DX and tooling.
