# Font System Migration Plan

**Goal**: Port the sophisticated font definition system from `@reference-ui/core` to `@reference-ui/cli`, allowing users to define fonts with weights, @font-face rules, and automatic token/recipe generation.

---

## Overview

The font system in reference-core provides a high-level API where users define fonts once, and the system generates:
- Font family tokens
- Font weight tokens  
- @font-face CSS rules
- Font recipes (for variants)
- Font pattern extension (for `font` and `weight` props)

This is more sophisticated than the current simple tokens in reference-cli and requires build-time collection and generation similar to the box pattern system.

---

## Current State

### reference-core (prototype)

**User-facing API** (`styled/font/fonts.ts`):
```ts
import { extendFont } from '../api'

extendFont('sans', {
  value: '"Inter", ui-sans-serif, sans-serif',
  fontFace: {
    src: 'url(...woff2) format("woff2")',
    fontWeight: '100 900',
    fontStyle: 'normal',
    fontDisplay: 'swap',
  },
  weights: {
    thin: '200',
    light: '300',
    normal: '400',
    semibold: '600',
    bold: '700',
    black: '900',
  },
  css: {
    letterSpacing: '-0.01em',
    fontWeight: 'normal',
  },
})
```

**Build process**:
1. User calls `extendFont()` which pushes to `globalThis.__fontCollector`
2. Build script (`createFontSystem`) evaluates `fonts.ts` to collect definitions
3. Generates `font.ts` with:
   - `extendTokens({ fonts: {...}, fontWeights: {...} })`
   - `extendGlobalFontface({ Inter: {...} })`
   - `extendRecipe({ fontStyle: { variants: {...} } })`
   - `extendPattern({ properties: { font, weight }, transform: {...} })`

**Problems**:
- Runtime evaluation during CLI execution
- Tightly coupled to reference-core structure
- Complex collector lifecycle

### reference-cli (current)

**What we have**:
- Simple font tokens in `internal/tokens.ts` (sans, serif, mono)
- Font pattern in `internal/props/font.ts` with hardcoded presets
- No user-facing font API
- No @font-face support
- No automatic token generation

**What we need**:
- User-facing `font()` API
- Build-time font collection
- Automatic generation of tokens, @font-face, recipes, and pattern

---

## Proposed Architecture

### 1. Font Fragment API

Create fragment-based font collection system.

**Location:** `src/system/api/fonts.ts`

```ts
import { createFragmentFunction } from '../../lib/fragments/collector'

export interface FontFaceRule {
  src: string
  fontWeight?: string
  fontStyle?: string
  fontDisplay?: string
  sizeAdjust?: string
  descentOverride?: string
}

export type FontWeightName =
  | 'thin'
  | 'light'
  | 'normal'
  | 'semibold'
  | 'bold'
  | 'black'

export interface FontDefinition {
  name: string
  value: string
  fontFace: FontFaceRule | FontFaceRule[]
  weights: Partial<Record<FontWeightName, string>>
  css?: Record<string, string>
}

const { fn, collector } = createFragmentFunction<FontDefinition>({
  name: 'font',
  targetFunction: 'font',
  globalKey: '__refFontCollector',
})

/**
 * Define a font family with weights and @font-face rules.
 * 
 * @example
 * ```ts
 * font('sans', {
 *   value: '"Inter", ui-sans-serif, sans-serif',
 *   fontFace: {
 *     src: 'url(...) format("woff2")',
 *     fontWeight: '100 900',
 *   },
 *   weights: {
 *     thin: '200',
 *     normal: '400',
 *     bold: '700',
 *   },
 *   css: {
 *     letterSpacing: '-0.01em',
 *   },
 * })
 * ```
 */
export function font(name: string, definition: Omit<FontDefinition, 'name'>): void {
  fn({ name, ...definition })
}

export function createFontCollector() {
  return collector
}
```

### 2. Internal Font Definitions

Port built-in fonts to use the new API.

**Location:** `src/system/internal/fonts.ts`

```ts
import { font } from '../api/fonts'

font('sans', {
  value: '"Inter", ui-sans-serif, sans-serif',
  fontFace: {
    src: 'url(https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2) format("woff2")',
    fontWeight: '100 900',
    fontStyle: 'normal',
    fontDisplay: 'swap',
  },
  weights: {
    thin: '200',
    light: '300',
    normal: '400',
    semibold: '600',
    bold: '700',
    black: '900',
  },
  css: {
    letterSpacing: '-0.01em',
    fontWeight: 'normal',
  },
})

font('serif', {
  value: '"Literata", ui-serif, serif',
  fontFace: {
    src: 'url(https://fonts.gstatic.com/s/literata/v40/or38Q6P12-iJxAIgLa78DkrbXsDgk0oVDaDlbJ5W7i5aOg.woff2) format("woff2")',
    fontWeight: '200 900',
    fontStyle: 'normal',
    fontDisplay: 'swap',
    sizeAdjust: '104%',
    descentOverride: '47%',
  },
  weights: {
    thin: '100',
    light: '300',
    normal: '373',
    semibold: '600',
    bold: '700',
    black: '900',
  },
  css: {
    letterSpacing: 'normal',
    fontWeight: 'normal',
  },
})

font('mono', {
  value: '"JetBrains Mono", ui-monospace, monospace',
  fontFace: {
    src: 'url(https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbV2o-flEEny0FZhsfKu5WU4xD7OwGtT0rU.woff2) format("woff2")',
    fontWeight: '100 800',
    fontStyle: 'normal',
    fontDisplay: 'swap',
    sizeAdjust: '101%',
  },
  weights: {
    thin: '100',
    light: '300',
    normal: '393',
    semibold: '600',
    bold: '700',
  },
  css: {
    letterSpacing: '-0.04em',
    fontWeight: 'normal',
  },
})
```

### 3. Build-Time Font Generation

Create `src/build/fontSystem.ts` to collect fonts and generate output.

```ts
#!/usr/bin/env node
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeFileSync, mkdirSync } from 'node:fs'
import { scanForFragments, collectFragments } from '../lib/fragments'
import { createFontCollector, type FontDefinition } from '../system/api/fonts'

const __filename = fileURLToPath(import.meta.url)
const CLI_ROOT = resolve(dirname(__filename), '../..')
const FONT_OUTPUT = join(CLI_ROOT, 'src/system/internal/fonts-generated.mjs')

async function buildFontSystem(): Promise<void> {
  console.log('[build:fonts] Scanning for font definitions...')
  
  const fontCollector = createFontCollector()
  
  const fragmentFiles = scanForFragments({
    include: ['src/system/internal/fonts.ts'],
    functionNames: ['font'],
    exclude: ['**/*.d.ts'],
    cwd: CLI_ROOT,
  })
  
  console.log(`[build:fonts] Found ${fragmentFiles.length} font files`)
  
  if (fragmentFiles.length === 0) {
    console.log('[build:fonts] No fonts found, skipping')
    return
  }
  
  const tempDir = join(CLI_ROOT, 'src/system/internal/.tmp')
  const definitions = await collectFragments({
    files: fragmentFiles,
    collector: fontCollector,
    tempDir,
  })
  
  console.log(`[build:fonts] Collected ${definitions.length} fonts`)
  
  const content = generateFontSystem(definitions)
  
  mkdirSync(dirname(FONT_OUTPUT), { recursive: true })
  writeFileSync(FONT_OUTPUT, content, 'utf-8')
  
  console.log(`[build:fonts] ✓ Generated ${FONT_OUTPUT}`)
}

function generateFontSystem(defs: FontDefinition[]): string {
  // Generate tokens
  const fontTokens = defs.map(d => `    ${d.name}: { value: ${JSON.stringify(d.value)} }`)
  const weightTokens = defs.flatMap(d => 
    Object.entries(d.weights)
      .filter(([, v]) => v)
      .map(([name, value]) => `    '${d.name}.${name}': { value: '${value}' }`)
  )
  
  // Generate @font-face rules
  const fontFaceEntries = defs.flatMap(d => {
    const familyKey = parseFontFamily(d.value)
    const rules = Array.isArray(d.fontFace) ? d.fontFace : [d.fontFace]
    
    if (rules.length === 1) {
      return [
        `  ${familyKey}: {`,
        `    src: '${rules[0].src}',`,
        `    fontDisplay: '${rules[0].fontDisplay ?? 'swap'}',`,
        rules[0].fontWeight ? `    fontWeight: '${rules[0].fontWeight}',` : '',
        rules[0].fontStyle ? `    fontStyle: '${rules[0].fontStyle}',` : '',
        rules[0].sizeAdjust ? `    sizeAdjust: '${rules[0].sizeAdjust}',` : '',
        rules[0].descentOverride ? `    descentOverride: '${rules[0].descentOverride}',` : '',
        `  },`
      ].filter(Boolean)
    }
    
    // Multiple @font-face rules (e.g., for different weights/styles)
    return [
      `  ${familyKey}: [`,
      ...rules.flatMap(rule => [
        `    {`,
        `      src: '${rule.src}',`,
        `      fontDisplay: '${rule.fontDisplay ?? 'swap'}',`,
        rule.fontWeight ? `      fontWeight: '${rule.fontWeight}',` : '',
        rule.fontStyle ? `      fontStyle: '${rule.fontStyle}',` : '',
        rule.sizeAdjust ? `      sizeAdjust: '${rule.sizeAdjust}',` : '',
        rule.descentOverride ? `      descentOverride: '${rule.descentOverride}',` : '',
        `    },`,
      ].filter(Boolean)),
      `  ],`
    ]
  })
  
  // Generate recipe variants
  const recipeVariants = defs.map(d => {
    const normalWeight = d.weights.normal ?? '400'
    const css = d.css ?? {}
    
    return [
      `        ${d.name}: {`,
      `          fontFamily: '${d.name}',`,
      `          fontWeight: '${css.fontWeight ?? normalWeight}',`,
      css.letterSpacing ? `          letterSpacing: '${css.letterSpacing}',` : '',
      `        },`,
    ].filter(Boolean).join('\n')
  })
  
  // Generate pattern transform
  const fontPresets = defs.map(d => {
    const normalWeight = d.weights.normal ?? '400'
    const css = d.css ?? {}
    const props = [
      `fontFamily: '${d.name}'`,
      `fontWeight: '${css.fontWeight ?? normalWeight}'`,
    ]
    if (css.letterSpacing) {
      props.push(`letterSpacing: '${css.letterSpacing}'`)
    }
    return `      ${d.name}: { ${props.join(', ')} },`
  })
  
  const weightTokensMap = defs.flatMap(d => 
    Object.entries(d.weights)
      .filter(([, v]) => v)
      .map(([name, value]) => `      '${d.name}.${name}': '${value}',`)
  )
  
  return `/** Generated by build/fontSystem.ts - do not edit manually */

import { tokens } from '../api/tokens.js'
import { globalFontface } from '../api/globalFontface.js'
import { recipe } from '../api/recipe.js'
import { extendPattern } from '../api/patterns.js'

tokens({
  fonts: {
${fontTokens.join(',\n')}
  },
  fontWeights: {
${weightTokens.join(',\n')}
  },
})

globalFontface({
${fontFaceEntries.join('\n')}
})

recipe('fontStyle', {
  className: 'r_font',
  variants: {
    font: {
${recipeVariants.join('\n')}
    },
  },
})

extendPattern({
  properties: {
    font: { type: 'string' },
    weight: { type: 'string' },
  },
  transform(props) {
    const { font, weight } = props
    
    const FONT_PRESETS = {
${fontPresets.join('\n')}
    }
    
    const WEIGHT_TOKENS = {
${weightTokensMap.join('\n')}
    }
    
    const result = {}
    
    if (font && typeof font === 'string' && FONT_PRESETS[font]) {
      Object.assign(result, FONT_PRESETS[font])
    }
    
    if (weight && typeof weight === 'string' && WEIGHT_TOKENS[weight]) {
      result.fontWeight = WEIGHT_TOKENS[weight]
    }
    
    return result
  },
})
`

  function parseFontFamily(value: string): string {
    const match = value.match(/^["']([^"']+)["']/)
    if (match) {
      const name = match[1]
      return name.includes(' ') ? `"${name}"` : name
    }
    return value.split(',')[0]?.trim() ?? 'unknown'
  }
}

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  await buildFontSystem()
}
```

### 4. Generated Output

**Location:** `src/system/internal/fonts-generated.mjs` (gitignored)

This file will contain:
- `tokens()` calls for fonts and fontWeights
- `globalFontface()` calls for @font-face rules
- `recipe()` call for font variants
- `extendPattern()` call for font pattern

### 5. Build Pipeline Integration

Update `package.json`:

```json
{
  "scripts": {
    "prebuild": "tsx src/build/boxPattern.ts && tsx src/build/fontSystem.ts && tsx src/build/styled.ts"
  }
}
```

**Build sequence:**
1. `build/boxPattern.ts` - Generate box pattern
2. `build/fontSystem.ts` - Generate font system (new!)
3. `build/styled.ts` - Bundle internal fragments + generate panda.config
4. Panda codegen
5. `tsup` - Bundle CLI

### 6. Remove Hardcoded Font Props

Delete or update `src/system/internal/props/font.ts` since the font pattern will be generated by `fontSystem.ts`.

Keep `src/system/internal/tokens.ts` but remove the hardcoded font tokens - they'll come from the generated file.

---

## API Design

### User-Facing API

Users can define fonts in their app:

```ts
// In user's app/fonts.ts or similar
import { font } from '@reference-ui/system'

font('display', {
  value: '"Playfair Display", serif',
  fontFace: {
    src: 'url(/fonts/playfair.woff2) format("woff2")',
    fontWeight: '400 900',
  },
  weights: {
    normal: '400',
    bold: '700',
    black: '900',
  },
  css: {
    letterSpacing: '-0.02em',
  },
})
```

Then use it:

```tsx
<Div font="display" weight="display.bold">
  Display Font
</Div>
```

### Internal Built-in Fonts

Built-in fonts (sans, serif, mono) defined in `src/system/internal/fonts.ts` using the same API.

---

## Testing Strategy

### Unit Tests (`packages/reference-cli`)

**Test file:** `src/system/api/fonts.test.ts`

```ts
describe('Font API', () => {
  it('collects font definitions via fragment system', () => {
    const collector = createFontCollector()
    // Test fragment collection
  })
  
  it('validates font definition structure', () => {
    // Test that font definitions have required fields
  })
})
```

### Build Tests (`packages/reference-app`)

**Test file:** `tests/system/fontSystem.test.ts`

```ts
describe('Font system generation', () => {
  it('generates fonts-generated.mjs during build', () => {
    const path = join(cliRoot, 'src/system/internal/fonts-generated.mjs')
    expect(existsSync(path)).toBe(true)
  })
  
  it('includes font tokens for all defined fonts', () => {
    const content = readFileSync(fontsGeneratedPath, 'utf-8')
    expect(content).toContain('fonts: {')
    expect(content).toContain('sans:')
    expect(content).toContain('serif:')
    expect(content).toContain('mono:')
  })
  
  it('includes fontWeight tokens for all weights', () => {
    const content = readFileSync(fontsGeneratedPath, 'utf-8')
    expect(content).toContain('fontWeights: {')
    expect(content).toContain("'sans.thin':")
    expect(content).toContain("'sans.bold':")
    expect(content).toContain("'serif.normal':")
  })
  
  it('includes @font-face rules via globalFontface', () => {
    const content = readFileSync(fontsGeneratedPath, 'utf-8')
    expect(content).toContain('globalFontface({')
    expect(content).toContain('Inter:')
    expect(content).toContain('src:')
    expect(content).toContain('fontDisplay:')
  })
  
  it('includes font recipe with variants', () => {
    const content = readFileSync(fontsGeneratedPath, 'utf-8')
    expect(content).toContain("recipe('fontStyle'")
    expect(content).toContain('variants: {')
    expect(content).toContain('font: {')
  })
  
  it('includes font pattern extension', () => {
    const content = readFileSync(fontsGeneratedPath, 'utf-8')
    expect(content).toContain('extendPattern({')
    expect(content).toContain('properties: {')
    expect(content).toContain('font:')
    expect(content).toContain('weight:')
    expect(content).toContain('transform(props) {')
    expect(content).toContain('FONT_PRESETS')
    expect(content).toContain('WEIGHT_TOKENS')
  })
  
  it('uses .mjs extension and JavaScript (not TypeScript)', () => {
    const content = readFileSync(fontsGeneratedPath, 'utf-8')
    expect(content).toContain("import { tokens } from '../api/tokens.js'")
    expect(content).not.toContain(': string')
    expect(content).not.toContain('Record<string, any>')
  })
  
  it('generates valid JavaScript that can be imported', async () => {
    // Dynamic import test
    await expect(() => import(fontsGeneratedPath)).not.toThrow()
  })
})
```

### Integration Tests

**Test file:** `tests/primitives/fontProps.test.tsx`

```ts
describe('Font props integration', () => {
  it('applies built-in sans font', () => {
    render(<Div data-testid="sans" font="sans">Sans</Div>)
    const el = screen.getByTestId('sans')
    expect(el).toBeInTheDocument()
    expect(el.className).toBeTruthy()
  })
  
  it('applies built-in serif font', () => {
    render(<Div data-testid="serif" font="serif">Serif</Div>)
    const el = screen.getByTestId('serif')
    expect(el).toBeInTheDocument()
    expect(el.className).toBeTruthy()
  })
  
  it('applies built-in mono font', () => {
    render(<Div data-testid="mono" font="mono">Mono</Div>)
    const el = screen.getByTestId('mono')
    expect(el).toBeInTheDocument()
    expect(el.className).toBeTruthy()
  })
  
  it('applies font weight tokens', () => {
    render(
      <Div data-testid="bold" font="sans" weight="sans.bold">
        Bold
      </Div>
    )
    const el = screen.getByTestId('bold')
    expect(el).toBeInTheDocument()
    expect(el.className).toBeTruthy()
  })
  
  it('combines font with other props', () => {
    render(
      <Div
        data-testid="combined"
        font="serif"
        weight="serif.semibold"
        fontSize="2rem"
        color="brand.primary"
      >
        Combined
      </Div>
    )
    const el = screen.getByTestId('combined')
    expect(el).toBeInTheDocument()
    expect(el.className).toBeTruthy()
  })
})
```

### E2E Tests

**Test file:** `tests/e2e/userFonts.test.ts`

```ts
describe('User-defined fonts', () => {
  it('allows users to define custom fonts', async () => {
    // Create a test app with custom font definition
    // Run ref sync
    // Verify custom font tokens are generated
    // Verify @font-face rules are included
  })
  
  it('merges user fonts with built-in fonts', async () => {
    // Verify both built-in (sans, serif, mono) and user fonts work
  })
})
```

---

## Migration Checklist

### Phase 1: API Setup
- [ ] Create `src/system/api/fonts.ts` with fragment collector
- [ ] Define `FontDefinition`, `FontFaceRule`, `FontWeightName` types
- [ ] Create `font()` function and `createFontCollector()`
- [ ] Export from system API index

### Phase 2: Internal Fonts
- [ ] Create `src/system/internal/fonts.ts`
- [ ] Port sans font definition using `font()` API
- [ ] Port serif font definition
- [ ] Port mono font definition

### Phase 3: Build Script
- [ ] Create `src/build/fontSystem.ts`
- [ ] Implement font scanning (use `scanForFragments`)
- [ ] Implement font collection (use `collectFragments`)
- [ ] Implement `generateFontSystem()` function
  - [ ] Generate tokens (fonts + fontWeights)
  - [ ] Generate @font-face rules
  - [ ] Generate recipe
  - [ ] Generate pattern extension
- [ ] Write output to `fonts-generated.mjs`
- [ ] Add to `.gitignore`

### Phase 4: Build Pipeline
- [ ] Update `package.json` prebuild script
- [ ] Remove hardcoded font tokens from `internal/tokens.ts`
- [ ] Remove hardcoded font pattern from `internal/props/font.ts`
- [ ] Test build sequence: boxPattern → fontSystem → styled → panda

### Phase 5: API Extensions
- [ ] Create `globalFontface()` API in `src/system/api/globalFontface.ts`
- [ ] Create `recipe()` API in `src/system/api/recipe.ts`
- [ ] Ensure these work with fragment system

### Phase 6: Testing
- [ ] Write unit tests for font API
- [ ] Write build tests for font generation
- [ ] Write integration tests for font props
- [ ] Add E2E tests for user-defined fonts
- [ ] Update existing font prop tests

### Phase 7: Documentation
- [ ] Update patterns.md with font system reference
- [ ] Create user-facing documentation for `font()` API
- [ ] Add examples to fonts.md

---

## Differences from reference-core

| Aspect | reference-core | reference-cli |
|--------|---------------|---------------|
| **Collection** | Runtime globalThis | Fragment collector |
| **Timing** | CLI runtime | Build time (prebuild) |
| **Scanner** | Custom eval script | `scanForFragments` |
| **Output** | `font.ts` (TypeScript) | `fonts-generated.mjs` (JavaScript) |
| **User API** | `extendFont()` in `styled/font/` | `font()` anywhere in app |
| **Integration** | Complex collector + eval | Fragment system |
| **Location** | One `fonts.ts` user file | Any file in user app |

---

## Benefits

1. **User-friendly** - Simple `font()` API, define once, use everywhere
2. **Automatic** - Tokens, @font-face, recipes, and patterns generated automatically
3. **Build-time** - No runtime overhead
4. **Fragment-based** - Consistent with patterns and other systems
5. **Type-safe** - Full TypeScript support in source files
6. **Flexible** - Users can define fonts anywhere in their app
7. **Performant** - Pre-bundled, no runtime collection

---

## Open Questions

1. **API Naming** - Should it be `font()` or `defineFont()`?
   - **Recommendation**: `font()` - shorter, matches patterns API style

2. **Multiple font faces** - How do we handle fonts with multiple weights in separate files?
   - **Recommendation**: Support both single `fontFace` object and array of `FontFaceRule[]`

3. **Recipe generation** - Do we need font recipes or just pattern extension?
   - **Recommendation**: Keep recipes for CSS-in-JS use cases, but patterns are primary

4. **User font location** - Where should users define fonts in their app?
   - **Recommendation**: Anywhere! Fragment system will find them. Suggest `app/fonts.ts` in docs.

5. **Fallback fonts** - How do we handle when no fonts are defined?
   - **Recommendation**: Keep built-in fonts (sans, serif, mono) as defaults

---

## Related Systems

- **Patterns** (`patterns.md`) - Font pattern is generated by font system
- **Tokens** - Font tokens generated automatically
- **Recipes** - Font recipe for variant-based styling
- **Global CSS** - @font-face rules injected via globalFontface

---

## Next Steps

1. Review and approve this plan
2. Start with Phase 1 (API setup)
3. Implement Phase 2 (internal fonts as POC)
4. Build Phase 3 (fontSystem build script)
5. Test end-to-end
6. Complete remaining phases
7. Update documentation

---

## Timeline Estimate

- Phase 1-2: API + Internal Fonts (similar to patterns API)
- Phase 3: Build Script (more complex than boxPattern - generates 4 outputs)
- Phase 4: Build Integration (straightforward)
- Phase 5: API Extensions (new APIs needed)
- Phase 6: Testing (comprehensive test suite)
- Phase 7: Documentation (user-facing docs)

**Total effort**: Larger than patterns migration due to multiple outputs and new APIs.
