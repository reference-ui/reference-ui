import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdirSync, rmSync, copyFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scanForFragments } from '../scanner'

const TEST_DIR = join(process.cwd(), '.test-fragments-scanner')
const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')

describe('scanForFragments', () => {
  beforeAll(() => {
    mkdirSync(join(TEST_DIR, 'src'), { recursive: true })

    copyFileSync(
      join(FIXTURES_DIR, 'has-call.ts'),
      join(TEST_DIR, 'src', 'has-call.ts')
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

    expect(files).toHaveLength(1)
    expect(files[0].endsWith('has-call.ts')).toBe(true)
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
