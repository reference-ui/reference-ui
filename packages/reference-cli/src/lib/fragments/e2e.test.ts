import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { createFragmentCollector, scanForFragments, collectFragments } from './index'

const TEST_PROJECT = join(process.cwd(), '.test-e2e-fragments')

/**
 * End-to-end test demonstrating how users would use the fragments system.
 *
 * Scenario: Building a design system where users can extend tokens/recipes
 * in their project files, and the CLI collects and merges them.
 */
describe('fragments end-to-end', () => {
  beforeAll(() => {
    // Set up a fake project structure
    mkdirSync(join(TEST_PROJECT, 'src', 'components'), { recursive: true })
    mkdirSync(join(TEST_PROJECT, 'src', 'theme'), { recursive: true })

    // User file 1: Component with tokens
    // Note: In reality, tokens() would be imported from @reference-ui/system
    // For testing, we inject it directly into the file
    writeFileSync(
      join(TEST_PROJECT, 'src', 'components', 'Button.tsx'),
      `
// Simulate the tokens() function being available
const globalKey = '__designTokens'
const tokens = (fragment) => {
  const collector = (globalThis as any)[globalKey]
  if (Array.isArray(collector)) {
    collector.push(fragment)
  }
}

// User extends the design system tokens
tokens({
  colors: {
    primary: { value: '#3B82F6' },
    primaryHover: { value: '#2563EB' },
  },
  spacing: {
    buttonPadding: { value: '12px 24px' },
  }
})

export const Button = () => <button>Click me</button>
`
    )

    // User file 2: Another component with tokens
    writeFileSync(
      join(TEST_PROJECT, 'src', 'components', 'Card.tsx'),
      `
const globalKey = '__designTokens'
const tokens = (fragment) => {
  const collector = (globalThis as any)[globalKey]
  if (Array.isArray(collector)) {
    collector.push(fragment)
  }
}

tokens({
  colors: {
    cardBg: { value: '#FFFFFF' },
    cardBorder: { value: '#E5E7EB' },
  },
  shadows: {
    card: { value: '0 1px 3px rgba(0,0,0,0.1)' },
  }
})

export const Card = () => <div>Card content</div>
`
    )

    // User file 3: Theme file with global tokens
    writeFileSync(
      join(TEST_PROJECT, 'src', 'theme', 'colors.ts'),
      `
const globalKey = '__designTokens'
const tokens = (fragment) => {
  const collector = (globalThis as any)[globalKey]
  if (Array.isArray(collector)) {
    collector.push(fragment)
  }
}

// Global color palette
tokens({
  colors: {
    gray50: { value: '#F9FAFB' },
    gray100: { value: '#F3F4F6' },
    gray200: { value: '#E5E7EB' },
    // ... more colors
  }
})
`
    )

    // User file 4: Recipe for a custom component
    writeFileSync(
      join(TEST_PROJECT, 'src', 'components', 'Alert.tsx'),
      `
const globalKey = '__recipes'
const recipe = (fragment) => {
  const collector = (globalThis as any)[globalKey]
  if (Array.isArray(collector)) {
    collector.push(fragment)
  }
}

recipe({
  className: 'alert',
  base: {
    padding: '16px',
    borderRadius: '8px',
  },
  variants: {
    status: {
      info: { bg: 'blue.100', color: 'blue.900' },
      success: { bg: 'green.100', color: 'green.900' },
      warning: { bg: 'yellow.100', color: 'yellow.900' },
      error: { bg: 'red.100', color: 'red.900' },
    }
  }
})

export const Alert = ({ status }: { status: string }) => (
  <div className={status}>Alert</div>
)
`
    )

    // File without fragments (should be ignored)
    writeFileSync(
      join(TEST_PROJECT, 'src', 'utils.ts'),
      `
export function formatDate(date: Date) {
  return date.toISOString()
}
`
    )
  })

  afterAll(() => {
    rmSync(TEST_PROJECT, { recursive: true, force: true })
  })

  // eslint-disable-next-line max-statements -- comprehensive e2e test covering full workflow
  it('complete workflow: scan → collect → merge', async () => {
    // ============================================================
    // STEP 1: CLI creates collectors for different fragment types
    // ============================================================

    interface TokenFragment {
      colors?: Record<string, { value: string }>
      spacing?: Record<string, { value: string }>
      shadows?: Record<string, { value: string }>
    }

    interface RecipeFragment {
      className: string
      base?: Record<string, unknown>
      variants?: Record<string, Record<string, unknown>>
    }

    const tokensCollector = createFragmentCollector<TokenFragment>({
      name: 'design-tokens',
      globalKey: '__designTokens',
    })

    const recipesCollector = createFragmentCollector<RecipeFragment>({
      name: 'recipes',
      globalKey: '__recipes',
    })

    // Note: These functions would normally be exported from @reference-ui/system
    // They're created here for documentation but not used directly (used in generated files)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, sonarjs/no-unused-vars, sonarjs/no-dead-store
    const tokens = tokensCollector.collect
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, sonarjs/no-unused-vars, sonarjs/no-dead-store
    const recipe = recipesCollector.collect

    // ============================================================
    // STEP 2: CLI scans user project for fragment calls
    // ============================================================

    const tokenFiles = scanForFragments({
      directories: [join(TEST_PROJECT, 'src')],
      functionNames: ['tokens'],
    })

    const recipeFiles = scanForFragments({
      directories: [join(TEST_PROJECT, 'src')],
      functionNames: ['recipe'],
    })

    // Should find files that call tokens()
    expect(tokenFiles).toHaveLength(3) // Button.tsx, Card.tsx, colors.ts
    expect(tokenFiles.some((f) => f.includes('Button.tsx'))).toBe(true)
    expect(tokenFiles.some((f) => f.includes('Card.tsx'))).toBe(true)
    expect(tokenFiles.some((f) => f.includes('colors.ts'))).toBe(true)

    // Should find files that call recipe()
    expect(recipeFiles).toHaveLength(1) // Alert.tsx
    expect(recipeFiles.some((f) => f.includes('Alert.tsx'))).toBe(true)

    // Should NOT find utils.ts (no fragment calls)
    expect(tokenFiles.every((f) => !f.includes('utils.ts'))).toBe(true)

    // ============================================================
    // STEP 3: CLI collects fragments by executing the files
    // ============================================================

    const tokenFragments = await collectFragments({
      files: tokenFiles,
      collector: tokensCollector,
      tempDir: join(TEST_PROJECT, '.ref', 'tokens'),
    })

    const recipeFragments = await collectFragments({
      files: recipeFiles,
      collector: recipesCollector,
      tempDir: join(TEST_PROJECT, '.ref', 'recipes'),
    })

    // Should have collected 3 token fragments
    expect(tokenFragments).toHaveLength(3)

    // Fragment from Button.tsx
    expect(tokenFragments[0]).toMatchObject({
      colors: {
        primary: { value: '#3B82F6' },
        primaryHover: { value: '#2563EB' },
      },
      spacing: {
        buttonPadding: { value: '12px 24px' },
      },
    })

    // Fragment from Card.tsx
    expect(tokenFragments[1]).toMatchObject({
      colors: {
        cardBg: { value: '#FFFFFF' },
        cardBorder: { value: '#E5E7EB' },
      },
      shadows: {
        card: { value: '0 1px 3px rgba(0,0,0,0.1)' },
      },
    })

    // Fragment from colors.ts
    expect(tokenFragments[2].colors).toBeDefined()
    expect(tokenFragments[2].colors?.gray50).toEqual({ value: '#F9FAFB' })

    // Should have collected 1 recipe fragment
    expect(recipeFragments).toHaveLength(1)
    expect(recipeFragments[0]).toMatchObject({
      className: 'alert',
      base: {
        padding: '16px',
        borderRadius: '8px',
      },
      variants: {
        status: {
          info: { bg: 'blue.100', color: 'blue.900' },
          success: { bg: 'green.100', color: 'green.900' },
        },
      },
    })

    // ============================================================
    // STEP 4: CLI merges fragments into final config
    // ============================================================

    // Deep merge all token fragments
    const mergedTokens: TokenFragment = {}

    for (const fragment of tokenFragments) {
      if (fragment.colors) {
        mergedTokens.colors = { ...mergedTokens.colors, ...fragment.colors }
      }
      if (fragment.spacing) {
        mergedTokens.spacing = { ...mergedTokens.spacing, ...fragment.spacing }
      }
      if (fragment.shadows) {
        mergedTokens.shadows = { ...mergedTokens.shadows, ...fragment.shadows }
      }
    }

    // Final merged config has all tokens from all files
    expect(mergedTokens.colors).toBeDefined()
    expect(Object.keys(mergedTokens.colors!)).toHaveLength(7) // 2 from Button + 2 from Card + 3 from colors
    expect(mergedTokens.colors!.primary).toEqual({ value: '#3B82F6' })
    expect(mergedTokens.colors!.cardBg).toEqual({ value: '#FFFFFF' })
    expect(mergedTokens.colors!.gray50).toEqual({ value: '#F9FAFB' })

    expect(mergedTokens.spacing).toBeDefined()
    expect(mergedTokens.spacing!.buttonPadding).toEqual({ value: '12px 24px' })

    expect(mergedTokens.shadows).toBeDefined()
    expect(mergedTokens.shadows!.card).toEqual({ value: '0 1px 3px rgba(0,0,0,0.1)' })

    // ============================================================
    // STEP 5: CLI would write the final config to disk
    // ============================================================

    // In real usage, CLI would generate panda.config.ts like:
    const finalConfig = {
      theme: {
        tokens: mergedTokens,
        extend: {
          recipes: recipeFragments.reduce(
            (acc, r) => ({
              ...acc,
              [r.className]: r,
            }),
            {}
          ),
        },
      },
    }

    expect(finalConfig.theme.tokens.colors).toBeDefined()
    expect(finalConfig.theme.extend.recipes).toHaveProperty('alert')
  })

  it('handles files with imports and dependencies', async () => {
    // Create a helper module
    writeFileSync(
      join(TEST_PROJECT, 'src', 'theme', 'helpers.ts'),
      `
export const createToken = (value: string) => ({ value })
export const colors = {
  brand: '#3B82F6',
  danger: '#EF4444',
}
`
    )

    // Create a file that uses the helper
    writeFileSync(
      join(TEST_PROJECT, 'src', 'theme', 'extended.ts'),
      `
import { createToken, colors } from './helpers'

const globalKey = '__tokensImports'
const tokens = (fragment) => {
  const collector = (globalThis as any)[globalKey]
  if (Array.isArray(collector)) {
    collector.push(fragment)
  }
}

tokens({
  colors: {
    brandPrimary: createToken(colors.brand),
    error: createToken(colors.danger),
  }
})
`
    )

    interface TokenFragment {
      colors?: Record<string, { value: string }>
    }

    const collector = createFragmentCollector<TokenFragment>({
      name: 'tokens-with-imports',
      globalKey: '__tokensImports',
    })

    const files = scanForFragments({
      directories: [join(TEST_PROJECT, 'src', 'theme')],
      functionNames: ['tokens'],
    })

    const fragments = await collectFragments({
      files: files.filter((f) => f.includes('extended.ts')),
      collector,
      tempDir: join(TEST_PROJECT, '.ref', 'imports'),
    })

    // microbundle should resolve imports and execute correctly
    expect(fragments).toHaveLength(1)
    expect(fragments[0].colors).toBeDefined()
    expect(fragments[0].colors!.brandPrimary).toEqual({ value: '#3B82F6' })
    expect(fragments[0].colors!.error).toEqual({ value: '#EF4444' })
  })

  it('can scan and collect from multiple directories', async () => {
    // Create additional directories
    mkdirSync(join(TEST_PROJECT, 'app', 'features', 'auth'), { recursive: true })
    mkdirSync(join(TEST_PROJECT, 'app', 'features', 'dashboard'), { recursive: true })

    writeFileSync(
      join(TEST_PROJECT, 'app', 'features', 'auth', 'styles.ts'),
      `
const globalKey = '__multiDir'
const tokens = (fragment) => {
  const collector = (globalThis as any)[globalKey]
  if (Array.isArray(collector)) {
    collector.push(fragment)
  }
}
tokens({ colors: { authBg: { value: '#F3F4F6' } } })
`
    )

    writeFileSync(
      join(TEST_PROJECT, 'app', 'features', 'dashboard', 'styles.ts'),
      `
const globalKey = '__multiDir'
const tokens = (fragment) => {
  const collector = (globalThis as any)[globalKey]
  if (Array.isArray(collector)) {
    collector.push(fragment)
  }
}
tokens({ colors: { dashboardBg: { value: '#FFFFFF' } } })
`
    )

    interface TokenFragment {
      colors?: Record<string, { value: string }>
    }

    const collector = createFragmentCollector<TokenFragment>({
      name: 'multi-dir',
      globalKey: '__multiDir',
    })

    // Scan multiple directories
    const files = scanForFragments({
      directories: [
        join(TEST_PROJECT, 'app', 'features', 'auth'),
        join(TEST_PROJECT, 'app', 'features', 'dashboard'),
      ],
      functionNames: ['tokens'],
    })

    expect(files).toHaveLength(2)

    const fragments = await collectFragments({
      files,
      collector,
      tempDir: join(TEST_PROJECT, '.ref', 'multi'),
    })

    expect(fragments).toHaveLength(2)
    expect(fragments[0].colors?.authBg).toEqual({ value: '#F3F4F6' })
    expect(fragments[1].colors?.dashboardBg).toEqual({ value: '#FFFFFF' })
  })
})
