import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdirSync, rmSync, copyFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createFragmentCollector, scanForFragments, collectFragments } from '../index'

const TEST_PROJECT = join(process.cwd(), '.test-e2e-fragments')
const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')

describe('fragments end-to-end', () => {
  beforeAll(() => {
    mkdirSync(join(TEST_PROJECT, 'src'), { recursive: true })

    // Copy all fixture files to test project
    copyFileSync(
      join(FIXTURES_DIR, 'define-function.ts'),
      join(TEST_PROJECT, 'src', 'define-function.ts')
    )

    copyFileSync(
      join(FIXTURES_DIR, 'use-function.ts'),
      join(TEST_PROJECT, 'src', 'use-function.ts')
    )

    copyFileSync(
      join(FIXTURES_DIR, 'with-constants.ts'),
      join(TEST_PROJECT, 'src', 'with-constants.ts')
    )
  })

  afterAll(() => {
    rmSync(TEST_PROJECT, { recursive: true, force: true })
  })

  it('scans for function calls, collects fragments, and merges them', async () => {
    // Create collector with same key as define-function.ts uses
    const collector = createFragmentCollector<any>({
      name: 'test',
      globalKey: '__myFunctionCollector',
    })

    // Scan for files calling myFunction
    const files = scanForFragments({
      directories: [join(TEST_PROJECT, 'src')],
      functionNames: ['myFunction'],
    })

    expect(files).toHaveLength(2)
    expect(files.every(f => f.includes('use-function.ts') || f.includes('with-constants.ts'))).toBe(true)

    // Collect fragments from those files
    const fragments = await collectFragments({
      files,
      collector,
      tempDir: join(TEST_PROJECT, '.ref'),
    })

    expect(fragments).toHaveLength(2)
    expect(fragments[0]).toEqual({ name: 'simple', value: 42 })
    expect(fragments[1]).toEqual({ name: 'with-constant', colors: ['red', 'blue'] })
  })
})
