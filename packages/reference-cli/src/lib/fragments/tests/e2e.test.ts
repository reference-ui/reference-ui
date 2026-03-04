/**
 * E2E Tests: Fragments API
 *
 * Tests the complete fragment collection flow from the perspective of a
 * system package author (e.g. someone building tokens or recipe support):
 *   1. Define collectors via createFragmentCollector
 *   2. Point collectFragments at user code (glob patterns or explicit files)
 *   3. Get plain data objects back
 */
import { afterAll, describe, expect, it } from 'vitest'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { createFragmentCollector } from '../index'
import { collectFragments } from '../runner'

const fixtureDir = join(import.meta.dirname, 'fixtures')
const tempDir = join(import.meta.dirname, '__temp__')

afterAll(() => {
  rmSync(tempDir, { recursive: true, force: true })
})

describe('collectFragments – planner API (glob patterns, multiple collectors)', () => {
  it('scans user code by glob and returns fragments keyed by collector name', async () => {
    // System package author defines collectors once
    const myFunction = createFragmentCollector<Record<string, unknown>>({
      name: 'myFunction',
      targetFunction: 'myFunction',
    })

    // CLI calls this with config.include from ui.config.ts
    const result = await collectFragments({
      collectors: [myFunction],
      include: ['**/*.ts'],
      tempDir,
      cwd: fixtureDir,
    })

    expect(result.myFunction).toHaveLength(2)
    expect(result.myFunction).toEqual(
      expect.arrayContaining([
        { name: 'simple', value: 42 },
        { name: 'with-constant', colors: ['red', 'blue'] },
      ])
    )
  })

  it('multiple collectors run in one pass, each keyed independently', async () => {
    const tokens = createFragmentCollector({
      name: 'tokens',
      targetFunction: 'myFunction',
    })
    const recipe = createFragmentCollector({
      name: 'recipe',
      targetFunction: 'myFunction',
    })

    const result = await collectFragments({
      collectors: [tokens, recipe],
      include: ['**/*.ts'],
      tempDir,
      cwd: fixtureDir,
    })

    expect(Object.keys(result)).toEqual(['tokens', 'recipe'])
    expect(result.tokens).toHaveLength(2)
    expect(result.recipe).toHaveLength(2)
  })

  it('returns empty arrays when no user files call the target function', async () => {
    const unused = createFragmentCollector({ name: 'unused', targetFunction: 'noSuchFn' })

    const result = await collectFragments({
      collectors: [unused],
      include: ['**/*.ts'],
      tempDir,
      cwd: fixtureDir,
    })

    expect(result.unused).toEqual([])
  })

  it('applies transform to collected fragments in planner mode', async () => {
    const tokenCollector = createFragmentCollector<Record<string, unknown>, { theme: { tokens: Record<string, unknown> } }>({
      name: 'tokens',
      targetFunction: 'myFunction',
      transform: (fragment) => ({
        theme: { tokens: fragment },
      }),
    })

    const result = await collectFragments({
      collectors: [tokenCollector],
      include: ['**/*.ts'],
      tempDir,
      cwd: fixtureDir,
    })

    expect(result.tokens).toHaveLength(2)
    expect(result.tokens[0]).toHaveProperty('theme.tokens')
    expect(result.tokens[0].theme.tokens).toEqual({ name: 'simple', value: 42 })
  })
})

describe('collectFragments – single-collector API (explicit file list)', () => {
  it('collects from a single user file', async () => {
    const myFunction = createFragmentCollector<Record<string, unknown>>({
      name: 'myFunction',
      targetFunction: 'myFunction',
    })

    const fragments = await collectFragments({
      files: [join(fixtureDir, 'use-function.ts')],
      collector: myFunction,
      tempDir,
    })

    expect(fragments).toEqual([{ name: 'simple', value: 42 }])
  })

  it('resolves constants defined outside the fragment call', async () => {
    const myFunction = createFragmentCollector<Record<string, unknown>>({
      name: 'myFunction',
      targetFunction: 'myFunction',
    })

    const fragments = await collectFragments({
      files: [join(fixtureDir, 'with-constants.ts')],
      collector: myFunction,
      tempDir,
    })

    expect(fragments).toEqual([{ name: 'with-constant', colors: ['red', 'blue'] }])
  })

  it('collects across multiple files in one call', async () => {
    const myFunction = createFragmentCollector<Record<string, unknown>>({
      name: 'myFunction',
      targetFunction: 'myFunction',
    })

    const fragments = await collectFragments({
      files: [join(fixtureDir, 'use-function.ts'), join(fixtureDir, 'with-constants.ts')],
      collector: myFunction,
      tempDir,
    })

    expect(fragments).toHaveLength(2)
  })

  it('applies transform in single-collector mode', async () => {
    interface Input {
      name: string
      value: number
    }
    interface Output {
      transformed: boolean
      original: Input
    }

    const transformCollector = createFragmentCollector<Input, Output>({
      name: 'transform',
      targetFunction: 'myFunction',
      transform: (input) => ({
        transformed: true,
        original: input,
      }),
    })

    const fragments = await collectFragments({
      files: [join(fixtureDir, 'use-function.ts')],
      collector: transformCollector,
      tempDir,
    })

    expect(fragments).toHaveLength(1)
    expect(fragments[0]).toEqual({
      transformed: true,
      original: { name: 'simple', value: 42 },
    })
  })
})
