import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdirSync, rmSync, copyFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createFragmentCollector, scanForFragments, collectFragments } from '../index'

const TEST_PROJECT = join(process.cwd(), '.test-e2e-fragments')
const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')
const SRC_DIR = join(TEST_PROJECT, 'src')
const USE_FUNCTION_FILE = 'use-function.ts'
const WITH_CONSTANTS_FILE = 'with-constants.ts'

describe('fragments end-to-end', () => {
  beforeAll(() => {
    mkdirSync(SRC_DIR, { recursive: true })

    copyFileSync(
      join(FIXTURES_DIR, USE_FUNCTION_FILE),
      join(SRC_DIR, USE_FUNCTION_FILE)
    )
    copyFileSync(
      join(FIXTURES_DIR, WITH_CONSTANTS_FILE),
      join(SRC_DIR, WITH_CONSTANTS_FILE)
    )
  })

  afterAll(() => {
    rmSync(TEST_PROJECT, { recursive: true, force: true })
  })

  it('scans for function calls, collects fragments, and merges them', async () => {
    const collector = createFragmentCollector<Record<string, unknown>>({
      name: 'myFunction',
      targetFunction: 'myFunction',
    })

    // Scan for files calling myFunction
    const files = scanForFragments({
      directories: [SRC_DIR],
      functionNames: ['myFunction'],
    })

    expect(files).toHaveLength(2)
    expect(files.every(f => f.includes(USE_FUNCTION_FILE) || f.includes(WITH_CONSTANTS_FILE))).toBe(true)

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
