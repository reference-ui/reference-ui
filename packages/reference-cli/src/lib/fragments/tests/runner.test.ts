import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { createFragmentCollector } from '../collector'
import { collectFragments } from '../runner'

const TEST_DIR = join(process.cwd(), '.test-fragments-runner')
const TEMP_DIR = join(TEST_DIR, '.ref')

describe('collectFragments', () => {
  beforeAll(() => {
    mkdirSync(join(TEST_DIR, 'src'), { recursive: true })
  })

  afterAll(() => {
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  beforeEach(() => {
    rmSync(TEMP_DIR, { recursive: true, force: true })
  })

  afterEach(() => {
    rmSync(TEMP_DIR, { recursive: true, force: true })
  })

  it('collects fragments from a single file', async () => {
    const collector = createFragmentCollector<any>({
      name: 'test',
      globalKey: '__testSingle',
    })

    const testFile = join(TEST_DIR, 'src', 'single.ts')
    writeFileSync(
      testFile,
      `
const collector = (globalThis as any)['${collector.config.globalKey}']
if (Array.isArray(collector)) {
  collector.push({ name: 'test', value: 1 })
}
`
    )

    const fragments = await collectFragments({
      files: [testFile],
      collector,
      tempDir: TEMP_DIR,
    })

    expect(fragments).toHaveLength(1)
    expect(fragments[0]).toEqual({ name: 'test', value: 1 })
  })

  it('collects fragments from multiple files', async () => {
    const collector = createFragmentCollector<any>({
      name: 'test',
      globalKey: '__testMultiple',
    })

    const file1 = join(TEST_DIR, 'src', 'file1.ts')
    const file2 = join(TEST_DIR, 'src', 'file2.ts')

    writeFileSync(
      file1,
      `
const collector = (globalThis as any)['${collector.config.globalKey}']
if (Array.isArray(collector)) {
  collector.push({ id: 1 })
  collector.push({ id: 2 })
}
`
    )

    writeFileSync(
      file2,
      `
const collector = (globalThis as any)['${collector.config.globalKey}']
if (Array.isArray(collector)) {
  collector.push({ id: 3 })
}
`
    )

    const fragments = await collectFragments({
      files: [file1, file2],
      collector,
      tempDir: TEMP_DIR,
    })

    expect(fragments).toHaveLength(3)
    expect(fragments).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
  })

  it('returns empty array when no fragments are collected', async () => {
    const collector = createFragmentCollector<any>({
      name: 'test',
      globalKey: '__testEmpty',
    })

    const testFile = join(TEST_DIR, 'src', 'no-fragments.ts')
    writeFileSync(testFile, `export const value = 123`)

    const fragments = await collectFragments({
      files: [testFile],
      collector,
      tempDir: TEMP_DIR,
    })

    expect(fragments).toEqual([])
  })

  it('cleans up globalThis after collection', async () => {
    const collector = createFragmentCollector<any>({
      name: 'test',
      globalKey: '__testCleanup',
    })

    const testFile = join(TEST_DIR, 'src', 'cleanup.ts')
    writeFileSync(
      testFile,
      `
const collector = (globalThis as any)['${collector.config.globalKey}']
if (Array.isArray(collector)) {
  collector.push({ test: 1 })
}
`
    )

    await collectFragments({
      files: [testFile],
      collector,
      tempDir: TEMP_DIR,
    })

    const global = (globalThis as any)[collector.config.globalKey]
    expect(global).toBeUndefined()
  })
})
