import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdirSync, rmSync, copyFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scanForFragments } from '../scanner'

const TEST_DIR = join(process.cwd(), '.test-fragments-scanner')
const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')
const SRC_DIR = join(TEST_DIR, 'src')
const USE_FUNCTION_FILE = 'use-function.ts'
const WITH_CONSTANTS_FILE = 'with-constants.ts'

describe('scanForFragments', () => {
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
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it('finds files that call the specified function', () => {
    const files = scanForFragments({
      directories: [TEST_DIR],
      functionNames: ['myFunction'],
    })

    expect(files).toHaveLength(2)
    expect(files.every(
      f => f.endsWith(USE_FUNCTION_FILE) || f.endsWith(WITH_CONSTANTS_FILE)
    )).toBe(true)
  })

  it('returns empty array for non-existent directories', () => {
    const files = scanForFragments({
      directories: ['/does/not/exist'],
      functionNames: ['myFunction'],
    })

    expect(files).toEqual([])
  })

  it('handles empty function names array', () => {
    const files = scanForFragments({
      directories: [TEST_DIR],
      functionNames: [],
    })

    expect(files).toEqual([])
  })

  it('returns absolute file paths', () => {
    const files = scanForFragments({
      directories: [TEST_DIR],
      functionNames: ['myFunction'],
    })

    files.forEach(file => {
      expect(file.startsWith('/')).toBe(true)
    })
  })
})
