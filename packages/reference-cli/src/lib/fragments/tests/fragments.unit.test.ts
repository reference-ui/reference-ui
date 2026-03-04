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
