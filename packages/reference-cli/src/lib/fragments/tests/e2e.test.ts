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
const SETUP_FILE = 'setup.ts'

describe('fragments end-to-end', () => {
  const collector = createFragmentCollector<Record<string, unknown>>({
    name: 'myFunction',
    targetFunction: 'myFunction',
  })

  beforeAll(() => {
    mkdirSync(SRC_DIR, { recursive: true })

    // Copy all fixture files including setup.ts
    copyFileSync(
      join(FIXTURES_DIR, SETUP_FILE),
      join(SRC_DIR, SETUP_FILE)
    )
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

  it('collects fragments from specific files', async () => {
    // Scan for files calling myFunction
    const files = scanForFragments({
      directories: [SRC_DIR],
      functionNames: ['myFunction'],
    })

    // Filter to just the user code files (not setup.ts)
    const relevantFiles = files.filter(f => f.includes(USE_FUNCTION_FILE) || f.includes(WITH_CONSTANTS_FILE))
    expect(relevantFiles).toHaveLength(2)

    // Collect fragments from those files
    const fragments = await collectFragments({
      files: relevantFiles,
      collector,
      tempDir: join(TEST_PROJECT, '.ref'),
    })

    expect(fragments).toHaveLength(2)
    expect(fragments[0]).toEqual({ name: 'simple', value: 42 })
    expect(fragments[1]).toEqual({ name: 'with-constant', colors: ['red', 'blue'] })
  })

  it('collects fragments using glob patterns', async () => {
    // Collect using glob patterns (planner API)
    const allFragments = await collectFragments({
      collectors: [collector],
      include: [join(SRC_DIR, '*.ts')],
      tempDir: join(TEST_PROJECT, '.ref-planner'),
    })

    expect(allFragments).toHaveProperty('myFunction')
    expect(allFragments.myFunction).toHaveLength(2)
    expect(allFragments.myFunction[0]).toEqual({ name: 'simple', value: 42 })
    expect(allFragments.myFunction[1]).toEqual({ name: 'with-constant', colors: ['red', 'blue'] })
  })

  it('supports multiple collectors', async () => {
    const collector1 = createFragmentCollector<Record<string, unknown>>({
      name: 'function1',
      targetFunction: 'myFunction',
    })

    const collector2 = createFragmentCollector<Record<string, unknown>>({
      name: 'function2',
      targetFunction: 'nonExistentFunction',
    })

    const allFragments = await collectFragments({
      collectors: [collector1, collector2],
      include: [join(SRC_DIR, '*.ts')],
      tempDir: join(TEST_PROJECT, '.ref-multi'),
    })

    expect(allFragments).toHaveProperty('function1')
    expect(allFragments).toHaveProperty('function2')
    expect(allFragments.function1).toHaveLength(2)
    expect(allFragments.function2).toHaveLength(0)
  })
})
