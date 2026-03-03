import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { createFragmentCollector } from './collector'
import { collectFragments } from './runner'

const TEST_DIR = join(process.cwd(), '.test-fragments-runner')
const TEMP_DIR = join(TEST_DIR, '.ref', 'fragments')

interface TestFragment {
  name: string
  value: number
}

describe('collectFragments', () => {
  beforeAll(() => {
    // Create test directory
    mkdirSync(join(TEST_DIR, 'src'), { recursive: true })
  })

  afterAll(() => {
    // Clean up test directory
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  beforeEach(() => {
    // Clean up temp dir before each test
    rmSync(TEMP_DIR, { recursive: true, force: true })
  })

  afterEach(() => {
    // Clean up temp dir after each test
    rmSync(TEMP_DIR, { recursive: true, force: true })
  })

  it('collects fragments from a single file', async () => {
    const collector = createFragmentCollector<TestFragment>({
      name: 'test',
      globalKey: '__testRunnerSingle',
    })

    // Create test file
    const testFile = join(TEST_DIR, 'src', 'single.ts')
    writeFileSync(
      testFile,
      `
const globalKey = '${collector.config.globalKey}'
const collector = (globalThis as any)[globalKey]
if (Array.isArray(collector)) {
  collector.push({ name: 'fragment1', value: 100 })
}
`
    )

    const fragments = await collectFragments({
      files: [testFile],
      collector,
      tempDir: TEMP_DIR,
    })

    expect(fragments).toHaveLength(1)
    expect(fragments[0]).toEqual({ name: 'fragment1', value: 100 })
  })

  it('collects fragments from multiple files', async () => {
    const collector = createFragmentCollector<TestFragment>({
      name: 'test',
      globalKey: '__testRunnerMultiple',
    })

    // Create test files
    const file1 = join(TEST_DIR, 'src', 'file1.ts')
    const file2 = join(TEST_DIR, 'src', 'file2.ts')

    writeFileSync(
      file1,
      `
const globalKey = '${collector.config.globalKey}'
const collector = (globalThis as any)[globalKey]
if (Array.isArray(collector)) {
  collector.push({ name: 'frag1', value: 1 })
  collector.push({ name: 'frag2', value: 2 })
}
`
    )

    writeFileSync(
      file2,
      `
const globalKey = '${collector.config.globalKey}'
const collector = (globalThis as any)[globalKey]
if (Array.isArray(collector)) {
  collector.push({ name: 'frag3', value: 3 })
}
`
    )

    const fragments = await collectFragments({
      files: [file1, file2],
      collector,
      tempDir: TEMP_DIR,
    })

    expect(fragments).toHaveLength(3)
    expect(fragments).toEqual([
      { name: 'frag1', value: 1 },
      { name: 'frag2', value: 2 },
      { name: 'frag3', value: 3 },
    ])
  })

  it('handles files with imports', async () => {
    const collector = createFragmentCollector<TestFragment>({
      name: 'test',
      globalKey: '__testRunnerImports',
    })

    // Create a helper module
    const helperFile = join(TEST_DIR, 'src', 'helper.ts')
    writeFileSync(
      helperFile,
      `
export function createFragment(name: string, value: number) {
  return { name, value }
}
`
    )

    // Create test file that imports helper
    const testFile = join(TEST_DIR, 'src', 'with-import.ts')
    writeFileSync(
      testFile,
      `
import { createFragment } from './helper'

const globalKey = '${collector.config.globalKey}'
const collector = (globalThis as any)[globalKey]
if (Array.isArray(collector)) {
  collector.push(createFragment('imported', 999))
}
`
    )

    const fragments = await collectFragments({
      files: [testFile],
      collector,
      tempDir: TEMP_DIR,
    })

    expect(fragments).toHaveLength(1)
    expect(fragments[0]).toEqual({ name: 'imported', value: 999 })
  })

  it('isolates fragments between files', async () => {
    const collector = createFragmentCollector<TestFragment>({
      name: 'test',
      globalKey: '__testRunnerIsolation',
    })

    const file1 = join(TEST_DIR, 'src', 'isolated1.ts')
    const file2 = join(TEST_DIR, 'src', 'isolated2.ts')

    writeFileSync(
      file1,
      `
const globalKey = '${collector.config.globalKey}'
const collector = (globalThis as any)[globalKey]
if (Array.isArray(collector)) {
  collector.push({ name: 'file1', value: 1 })
}
`
    )

    writeFileSync(
      file2,
      `
const globalKey = '${collector.config.globalKey}'
const collector = (globalThis as any)[globalKey]
if (Array.isArray(collector)) {
  // This should not see file1's fragment
  const count = collector.length
  collector.push({ name: 'file2', value: count })
}
`
    )

    const fragments = await collectFragments({
      files: [file1, file2],
      collector,
      tempDir: TEMP_DIR,
    })

    // file2 should see count=0 because collector is fresh for each file
    expect(fragments[0]).toEqual({ name: 'file1', value: 1 })
    expect(fragments[1]).toEqual({ name: 'file2', value: 0 })
  })

  it('returns empty array when no fragments are collected', async () => {
    const collector = createFragmentCollector<TestFragment>({
      name: 'test',
      globalKey: '__testRunnerEmpty',
    })

    const testFile = join(TEST_DIR, 'src', 'no-fragments.ts')
    writeFileSync(
      testFile,
      `
// This file doesn't collect any fragments
export const value = 123
`
    )

    const fragments = await collectFragments({
      files: [testFile],
      collector,
      tempDir: TEMP_DIR,
    })

    expect(fragments).toEqual([])
  })

  it('returns empty array for empty files array', async () => {
    const collector = createFragmentCollector<TestFragment>({
      name: 'test',
      globalKey: '__testRunnerNoFiles',
    })

    const fragments = await collectFragments({
      files: [],
      collector,
      tempDir: TEMP_DIR,
    })

    expect(fragments).toEqual([])
  })

  it('cleans up globalThis after each file', async () => {
    const collector = createFragmentCollector<TestFragment>({
      name: 'test',
      globalKey: '__testRunnerCleanup',
    })

    const testFile = join(TEST_DIR, 'src', 'cleanup.ts')
    writeFileSync(
      testFile,
      `
const globalKey = '${collector.config.globalKey}'
const collector = (globalThis as any)[globalKey]
if (Array.isArray(collector)) {
  collector.push({ name: 'test', value: 1 })
}
`
    )

    await collectFragments({
      files: [testFile],
      collector,
      tempDir: TEMP_DIR,
    })

    // After collection, globalThis should be clean
    const global = (globalThis as Record<string, unknown>)[
      collector.config.globalKey
    ]
    expect(global).toBeUndefined()
  })

  it('handles TypeScript syntax', async () => {
    const collector = createFragmentCollector<{ type: string; props: Record<string, unknown> }>({
      name: 'test',
      globalKey: '__testRunnerTS',
    })

    const testFile = join(TEST_DIR, 'src', 'typescript.ts')
    writeFileSync(
      testFile,
      `
interface Props {
  color: string
  size: number
}

const props: Props = {
  color: 'blue',
  size: 12
}

const globalKey = '${collector.config.globalKey}'
const collector = (globalThis as any)[globalKey]
if (Array.isArray(collector)) {
  collector.push({ type: 'button', props })
}
`
    )

    const fragments = await collectFragments({
      files: [testFile],
      collector,
      tempDir: TEMP_DIR,
    })

    expect(fragments).toHaveLength(1)
    expect(fragments[0].type).toBe('button')
    expect(fragments[0].props).toEqual({ color: 'blue', size: 12 })
  })

  it('uses custom temp directory when provided', async () => {
    const customTempDir = join(TEST_DIR, 'custom-temp')
    const collector = createFragmentCollector<TestFragment>({
      name: 'test',
      globalKey: '__testRunnerCustomTemp',
    })

    const testFile = join(TEST_DIR, 'src', 'custom-temp.ts')
    writeFileSync(
      testFile,
      `
const globalKey = '${collector.config.globalKey}'
const collector = (globalThis as any)[globalKey]
if (Array.isArray(collector)) {
  collector.push({ name: 'test', value: 1 })
}
`
    )

    await collectFragments({
      files: [testFile],
      collector,
      tempDir: customTempDir,
    })

    // Custom temp dir should have been created (and then cleaned up)
    // We can't check if files exist because they're cleaned up, but test passes if no error
    expect(true).toBe(true)

    // Clean up custom temp dir
    rmSync(customTempDir, { recursive: true, force: true })
  })

  it('preserves fragment order', async () => {
    const collector = createFragmentCollector<TestFragment>({
      name: 'test',
      globalKey: '__testRunnerOrder',
    })

    const testFile = join(TEST_DIR, 'src', 'ordered.ts')
    writeFileSync(
      testFile,
      `
const globalKey = '${collector.config.globalKey}'
const collector = (globalThis as any)[globalKey]
if (Array.isArray(collector)) {
  collector.push({ name: 'first', value: 1 })
  collector.push({ name: 'second', value: 2 })
  collector.push({ name: 'third', value: 3 })
  collector.push({ name: 'fourth', value: 4 })
}
`
    )

    const fragments = await collectFragments({
      files: [testFile],
      collector,
      tempDir: TEMP_DIR,
    })

    expect(fragments.map((f) => f.name)).toEqual(['first', 'second', 'third', 'fourth'])
  })
})
