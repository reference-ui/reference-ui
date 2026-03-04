import { afterAll, describe, expect, it } from 'vitest'
import { rmSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { createFragmentCollector } from '../index'
import { scanForFragments } from '../scanner'
import { collectFragments } from '../runner'

const fixtureDir = join(import.meta.dirname, 'fixtures')
const tempDir = join(import.meta.dirname, '__temp__')
const ALL_TS = '**/*.ts'
const USE_FUNCTION_FIXTURE = 'use-function.ts'
const WITH_CONSTANTS_FIXTURE = 'with-constants.ts'

afterAll(() => {
  rmSync(tempDir, { recursive: true, force: true })
})

// ---------------------------------------------------------------------------
// Unit: createFragmentCollector
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

  it('does nothing when called before init()', () => {
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

  it('uses targetFunction to derive globalKey when provided', () => {
    const c = createFragmentCollector({ name: 'n', targetFunction: 'tokens' })
    expect(c.config.globalKey).toBe('__refTokensCollector')
  })

  it('falls back to name for globalKey when targetFunction is omitted', () => {
    const c = createFragmentCollector({ name: 'recipe' })
    expect(c.config.globalKey).toBe('__refRecipeCollector')
  })
})

// ---------------------------------------------------------------------------
// Unit: scanForFragments
// ---------------------------------------------------------------------------

describe('scanForFragments', () => {
  it('finds fixture files that call myFunction()', () => {
    const files = scanForFragments({
      include: [ALL_TS],
      functionNames: ['myFunction'],
      cwd: fixtureDir,
    })
    const names = files.map(f => f.split('/').at(-1))
    expect(names).toContain(USE_FUNCTION_FIXTURE)
    expect(names).toContain(WITH_CONSTANTS_FIXTURE)
  })

  it('regex-matches comments too (known limitation, same as old system)', () => {
    // setup.ts has a JSDoc comment: `myFunction({ ... })` — the scanner matches it.
    // This is an intentional trade-off: regex scanning is fast but not AST-aware.
    const files = scanForFragments({
      include: [ALL_TS],
      functionNames: ['myFunction'],
      cwd: fixtureDir,
    })
    const names = files.map(f => f.split('/').at(-1))
    // Comment in setup.ts contains `myFunction({` so it IS matched
    expect(names).toContain('setup.ts')
  })

  it('returns empty array when no files match', () => {
    const files = scanForFragments({
      include: [ALL_TS],
      functionNames: ['doesNotExist'],
      cwd: fixtureDir,
    })
    expect(files).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Integration: collectFragments – single-collector API
// ---------------------------------------------------------------------------

describe('collectFragments (single collector)', () => {
  it('collects fragments from a single file', async () => {
    const collector = createFragmentCollector<Record<string, unknown>>({
      name: 'myFunction',
      targetFunction: 'myFunction',
    })
    mkdirSync(tempDir, { recursive: true })

    const files = [join(fixtureDir, USE_FUNCTION_FIXTURE)]
    const fragments = await collectFragments({ files, collector, tempDir })

    expect(fragments).toHaveLength(1)
    expect(fragments[0]).toEqual({ name: 'simple', value: 42 })
  })

  it('collects fragments from a file using constants', async () => {
    const collector = createFragmentCollector<Record<string, unknown>>({
      name: 'myFunction',
      targetFunction: 'myFunction',
    })

    const files = [join(fixtureDir, WITH_CONSTANTS_FIXTURE)]
    const fragments = await collectFragments({ files, collector, tempDir })

    expect(fragments).toHaveLength(1)
    expect(fragments[0]).toEqual({ name: 'with-constant', colors: ['red', 'blue'] })
  })

  it('collects from multiple files in one call', async () => {
    const collector = createFragmentCollector<Record<string, unknown>>({
      name: 'myFunction',
      targetFunction: 'myFunction',
    })

    const files = [
      join(fixtureDir, USE_FUNCTION_FIXTURE),
      join(fixtureDir, WITH_CONSTANTS_FIXTURE),
    ]
    const fragments = await collectFragments({ files, collector, tempDir })

    expect(fragments).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Integration: collectFragments – planner API
// ---------------------------------------------------------------------------

describe('collectFragments (planner)', () => {
  it('scans by glob and returns keyed result', async () => {
    const myFunction = createFragmentCollector<Record<string, unknown>>({
      name: 'myFunction',
      targetFunction: 'myFunction',
    })

    const result = await collectFragments({
      collectors: [myFunction],
      include: [ALL_TS],
      tempDir,
      cwd: fixtureDir,
    })

    expect(result).toHaveProperty('myFunction')
    expect(result.myFunction).toHaveLength(2)
  })

  it('result keys match collector names', async () => {
    const a = createFragmentCollector({ name: 'alpha', targetFunction: 'myFunction' })
    const b = createFragmentCollector({ name: 'beta', targetFunction: 'myFunction' })

    const result = await collectFragments({
      collectors: [a, b],
      include: [ALL_TS],
      tempDir,
      cwd: fixtureDir,
    })

    expect(Object.keys(result)).toEqual(['alpha', 'beta'])
    // Both collectors capture the same calls (same targetFunction/globalKey)
    expect(result.alpha).toHaveLength(2)
    expect(result.beta).toHaveLength(2)
  })

  it('returns empty arrays when no files match', async () => {
    const c = createFragmentCollector({ name: 'nothing', targetFunction: 'noSuchFn' })

    const result = await collectFragments({
      collectors: [c],
      include: [ALL_TS],
      tempDir,
      cwd: fixtureDir,
    })

    expect(result.nothing).toEqual([])
  })
})
