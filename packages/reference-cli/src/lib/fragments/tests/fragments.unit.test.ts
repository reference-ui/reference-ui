import { describe, expect, it } from 'vitest'
import { join } from 'node:path'
import { createFragmentCollector } from '../index'
import { scanForFragments } from '../scanner'

const fixtureDir = join(import.meta.dirname, 'fixtures')

// ---------------------------------------------------------------------------
// createFragmentCollector
// ---------------------------------------------------------------------------

describe('createFragmentCollector', () => {
  it('returns a callable function', () => {
    const c = createFragmentCollector({ name: 'test' })
    expect(typeof c).toBe('function')
  })

  it('attaches config, init, getFragments, cleanup', () => {
    const c = createFragmentCollector({ name: 'test' })
    expect(c.config.name).toBe('test')
    expect(typeof c.init).toBe('function')
    expect(typeof c.getFragments).toBe('function')
    expect(typeof c.cleanup).toBe('function')
  })

  it('pushes fragments to globalThis when called after init()', () => {
    const c = createFragmentCollector<{ x: number }>({ name: 'push-test' })
    c.init()
    c({ x: 1 })
    c({ x: 2 })
    expect(c.getFragments()).toEqual([{ x: 1 }, { x: 2 }])
    c.cleanup()
  })

  it('does nothing (silently drops) when called before init()', () => {
    const c = createFragmentCollector<{ x: number }>({ name: 'no-init-test' })
    c({ x: 99 })
    c.init()
    expect(c.getFragments()).toEqual([])
    c.cleanup()
  })

  it('removes globalThis key on cleanup()', () => {
    const c = createFragmentCollector({ name: 'cleanup-test' })
    c.init()
    c.cleanup()
    expect((globalThis as Record<string, unknown>)[c.config.globalKey]).toBeUndefined()
  })

  it('two collectors with different names do not share state', () => {
    const a = createFragmentCollector<number>({ name: 'a-iso' })
    const b = createFragmentCollector<number>({ name: 'b-iso' })
    a.init()
    b.init()
    a(1)
    b(2)
    expect(a.getFragments()).toEqual([1])
    expect(b.getFragments()).toEqual([2])
    a.cleanup()
    b.cleanup()
  })

  it('derives globalKey from targetFunction when provided', () => {
    const c = createFragmentCollector({ name: 'n', targetFunction: 'tokens' })
    expect(c.config.globalKey).toBe('__refTokensCollector')
  })

  it('falls back to name for globalKey when targetFunction is omitted', () => {
    const c = createFragmentCollector({ name: 'recipe' })
    expect(c.config.globalKey).toBe('__refRecipeCollector')
  })

  it('emits runtime setup helpers for generated files', () => {
    const c = createFragmentCollector({
      name: 'tokens',
      targetFunction: 'tokens',
      transform: (fragment: { colors: Record<string, unknown> }) => ({
        theme: { tokens: fragment },
      }),
    })

    expect(c.toScript()).toBe("globalThis['__refTokensCollector'] = []")
    expect(c.toRuntimeFunction()).toBe(
      "const tokens = (fragment) => { const c = globalThis['__refTokensCollector']; if (Array.isArray(c)) c.push(fragment) }"
    )
    expect(c.toGetter()).toContain("globalThis['__refTokensCollector']")
    expect(c.toGetter()).toContain('fragments.map(')
  })
})

// ---------------------------------------------------------------------------
// createFragmentCollector with transform
// ---------------------------------------------------------------------------

describe('createFragmentCollector with transform', () => {
  it('returns identity when no transform is provided', () => {
    const c = createFragmentCollector<{ x: number }>({ name: 'identity-test' })
    c.init()
    c({ x: 1 })
    c({ x: 2 })
    expect(c.getFragments()).toEqual([{ x: 1 }, { x: 2 }])
    c.cleanup()
  })

  it('applies transform to each collected fragment', () => {
    interface FontDef {
      name: string
      family: string
    }
    interface TokenConfig {
      theme: { tokens: { fonts: Record<string, { value: string }> } }
    }

    const fontCollector = createFragmentCollector<FontDef, TokenConfig>({
      name: 'fonts',
      transform: (font) => ({
        theme: {
          tokens: {
            fonts: {
              [font.name]: { value: font.family },
            },
          },
        },
      }),
    })

    fontCollector.init()
    fontCollector({ name: 'sans', family: 'Inter' })
    fontCollector({ name: 'mono', family: 'Fira Code' })

    const result = fontCollector.getFragments()
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      theme: { tokens: { fonts: { sans: { value: 'Inter' } } } },
    })
    expect(result[1]).toEqual({
      theme: { tokens: { fonts: { mono: { value: 'Fira Code' } } } },
    })
    fontCollector.cleanup()
  })

  it('works with complex transforms', () => {
    interface RecipeDef {
      name: string
      base: Record<string, unknown>
      variants?: Record<string, unknown>
    }

    const recipeCollector = createFragmentCollector<RecipeDef, { theme: { recipes: Record<string, RecipeDef> } }>({
      name: 'recipe',
      transform: (recipe) => ({
        theme: {
          recipes: {
            [recipe.name]: recipe,
          },
        },
      }),
    })

    recipeCollector.init()
    recipeCollector({
      name: 'button',
      base: { px: 4, py: 2 },
      variants: { size: { sm: { px: 2 } } },
    })

    const result = recipeCollector.getFragments()
    expect(result).toHaveLength(1)
    expect(result[0].theme.recipes.button).toEqual({
      name: 'button',
      base: { px: 4, py: 2 },
      variants: { size: { sm: { px: 2 } } },
    })
    recipeCollector.cleanup()
  })

  it('transform receives correct input type', () => {
    const c = createFragmentCollector<number, string>({
      name: 'stringify',
      transform: (num) => {
        // TypeScript should infer num as number
        return `value: ${num}`
      },
    })

    c.init()
    c(42)
    c(100)
    expect(c.getFragments()).toEqual(['value: 42', 'value: 100'])
    c.cleanup()
  })
})

// ---------------------------------------------------------------------------
// scanForFragments
// ---------------------------------------------------------------------------

describe('scanForFragments', () => {
  it('finds files that call the target function', () => {
    const files = scanForFragments({
      include: ['**/*.ts'],
      functionNames: ['myFunction'],
      cwd: fixtureDir,
    })
    const names = files.map(f => f.split('/').at(-1))
    expect(names).toContain('use-function.ts')
    expect(names).toContain('with-constants.ts')
  })

  it('matches function calls inside comments (known regex limitation)', () => {
    // Regex scanning is fast but not AST-aware — comments with `fn(` are matched.
    // This is the same behaviour as the old reference-core scanner.
    const files = scanForFragments({
      include: ['**/*.ts'],
      functionNames: ['myFunction'],
      cwd: fixtureDir,
    })
    const names = files.map(f => f.split('/').at(-1))
    expect(names).toContain('setup.ts')
  })

  it('returns empty array when no files match', () => {
    const files = scanForFragments({
      include: ['**/*.ts'],
      functionNames: ['doesNotExist'],
      cwd: fixtureDir,
    })
    expect(files).toHaveLength(0)
  })

  it('does not match a longer identifier that starts with the function name', () => {
    // e.g. `myFunctionExtended(` should not match `myFunction`
    const files = scanForFragments({
      include: ['**/*.ts'],
      functionNames: ['myFunctionExtended'],
      cwd: fixtureDir,
    })
    expect(files).toHaveLength(0)
  })
})
