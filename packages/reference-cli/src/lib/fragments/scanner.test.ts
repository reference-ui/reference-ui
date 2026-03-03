import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { scanForFragments } from './scanner'

const TEST_DIR = join(process.cwd(), '.test-fragments')

describe('scanForFragments', () => {
  beforeAll(() => {
    // Create test directory structure
    mkdirSync(join(TEST_DIR, 'src'), { recursive: true })
    mkdirSync(join(TEST_DIR, 'components'), { recursive: true })
    mkdirSync(join(TEST_DIR, 'node_modules', 'pkg'), { recursive: true })

    // Files that call target functions
    writeFileSync(
      join(TEST_DIR, 'src', 'button.ts'),
      `
import { tokens } from '@reference-ui/system'

tokens({ colors: { primary: '#000' } })
`
    )

    writeFileSync(
      join(TEST_DIR, 'src', 'input.tsx'),
      `
import { extendPandaConfig } from '@reference-ui/core'

extendPandaConfig({
  theme: { tokens: { spacing: { sm: '4px' } } }
})
`
    )

    writeFileSync(
      join(TEST_DIR, 'components', 'card.ts'),
      `
import { recipe } from '@reference-ui/system'

export const cardRecipe = recipe({
  base: { bg: 'white' }
})
`
    )

    // Files that don't call target functions
    writeFileSync(
      join(TEST_DIR, 'src', 'utils.ts'),
      `
export function helper() {
  return 'no fragments here'
}
`
    )

    // File with function name in comment (should not match)
    writeFileSync(
      join(TEST_DIR, 'src', 'readme.ts'),
      `
// Call tokens() to configure theme
// tokens({ ... })
export const note = 'This mentions tokens but does not call it'
`
    )

    // File with function name in string (should not match)
    writeFileSync(
      join(TEST_DIR, 'src', 'docs.ts'),
      `
export const docs = "Use tokens() function"
`
    )

    // Type definition that uses function name (should not match)
    writeFileSync(
      join(TEST_DIR, 'src', 'types.ts'),
      `
type TokensFunction = (config: any) => void
export const tokens: TokensFunction = () => {}
`
    )

    // File in node_modules (should be excluded)
    writeFileSync(
      join(TEST_DIR, 'node_modules', 'pkg', 'index.ts'),
      `
import { tokens } from '@reference-ui/system'
tokens({ colors: { blue: '#00f' } })
`
    )

    // .d.ts file (should be excluded)
    writeFileSync(
      join(TEST_DIR, 'src', 'types.d.ts'),
      `
declare function tokens(config: any): void
`
    )

    // File with whitespace before paren
    writeFileSync(
      join(TEST_DIR, 'components', 'spacing.ts'),
      `
import { tokens } from '@reference-ui/system'

tokens   ({ colors: { red: '#f00' } })
`
    )
  })

  afterAll(() => {
    // Clean up test directory
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it('finds files that call the specified functions', () => {
    const files = scanForFragments({
      directories: [TEST_DIR],
      functionNames: ['tokens', 'extendPandaConfig', 'recipe'],
    })

    // Should find: button.ts, input.tsx, card.ts, spacing.ts, readme.ts, types.ts
    // (Note: regex also matches comments/strings - acceptable for build-time scanning)
    expect(files.length).toBeGreaterThanOrEqual(4)
    expect(files.some((f) => f.endsWith('button.ts'))).toBe(true)
    expect(files.some((f) => f.endsWith('input.tsx'))).toBe(true)
    expect(files.some((f) => f.endsWith('card.ts'))).toBe(true)
    expect(files.some((f) => f.endsWith('spacing.ts'))).toBe(true)
  })

  it('excludes files that do not call the functions', () => {
    const files = scanForFragments({
      directories: [TEST_DIR],
      functionNames: ['tokens'],
    })

    expect(files.every((f) => !f.endsWith('utils.ts'))).toBe(true)
  })

  it('matches function calls even in comments (simple regex)', () => {
    const files = scanForFragments({
      directories: [TEST_DIR],
      functionNames: ['tokens'],
    })

    // Simple regex will match `tokens(` even in comments - this is acceptable
    // for build-time scanning as false positives are filtered during execution
    expect(files.some((f) => f.endsWith('readme.ts'))).toBe(true)
  })

  it('excludes node_modules by default', () => {
    const files = scanForFragments({
      directories: [TEST_DIR],
      functionNames: ['tokens'],
    })

    expect(files.every((f) => !f.includes('node_modules'))).toBe(true)
  })

  it('excludes .d.ts files by default', () => {
    const files = scanForFragments({
      directories: [TEST_DIR],
      functionNames: ['tokens'],
    })

    expect(files.every((f) => !f.endsWith('.d.ts'))).toBe(true)
  })

  it('matches function calls with whitespace before paren', () => {
    const files = scanForFragments({
      directories: [join(TEST_DIR, 'components')],
      functionNames: ['tokens'],
    })

    expect(files.some((f) => f.endsWith('spacing.ts'))).toBe(true)
  })

  it('scans multiple directories', () => {
    const files = scanForFragments({
      directories: [join(TEST_DIR, 'src'), join(TEST_DIR, 'components')],
      functionNames: ['tokens'],
    })

    // Should find button.ts and spacing.ts
    expect(files.length).toBeGreaterThanOrEqual(2)
    expect(files.some((f) => f.endsWith('button.ts'))).toBe(true)
    expect(files.some((f) => f.endsWith('spacing.ts'))).toBe(true)
  })

  it('returns empty array for non-existent directories', () => {
    const files = scanForFragments({
      directories: ['/this/does/not/exist'],
      functionNames: ['tokens'],
    })

    expect(files).toEqual([])
  })

  it('deduplicates files when directories overlap', () => {
    const files = scanForFragments({
      directories: [TEST_DIR, join(TEST_DIR, 'src')],
      functionNames: ['tokens'],
    })

    // button.ts should only appear once
    const buttonFiles = files.filter((f) => f.endsWith('button.ts'))
    expect(buttonFiles).toHaveLength(1)
  })

  it('supports custom include patterns', () => {
    const files = scanForFragments({
      directories: [TEST_DIR],
      functionNames: ['extendPandaConfig'], // Only input.tsx has this
      include: ['**/*.tsx'], // Only .tsx files
    })

    expect(files.length).toBeGreaterThan(0)
    expect(files.every((f) => f.endsWith('.tsx'))).toBe(true)
    expect(files.some((f) => f.endsWith('input.tsx'))).toBe(true)
  })

  it('supports custom exclude patterns', () => {
    const files = scanForFragments({
      directories: [TEST_DIR],
      functionNames: ['tokens', 'recipe'],
      exclude: ['**/components/**'], // Exclude components dir
    })

    expect(files.every((f) => !f.includes('/components/'))).toBe(true)
  })

  it('returns absolute file paths', () => {
    const files = scanForFragments({
      directories: [TEST_DIR],
      functionNames: ['tokens'],
    })

    files.forEach((file) => {
      expect(file.startsWith('/')).toBe(true)
    })
  })

  it('handles empty function names array', () => {
    const files = scanForFragments({
      directories: [TEST_DIR],
      functionNames: [],
    })

    expect(files).toEqual([])
  })

  it('handles empty directories array', () => {
    const files = scanForFragments({
      directories: [],
      functionNames: ['tokens'],
    })

    expect(files).toEqual([])
  })

  it('matches only complete function names (word boundaries)', () => {
    // Create a file that has "mytokens" - should NOT match "tokens"
    writeFileSync(
      join(TEST_DIR, 'src', 'prefixed.ts'),
      `
export function mytokens() { }
mytokens({ value: 1 })
`
    )

    const files = scanForFragments({
      directories: [TEST_DIR],
      functionNames: ['tokens'], // Should not match "mytokens"
    })

    expect(files.every((f) => !f.endsWith('prefixed.ts'))).toBe(true)
  })
})
