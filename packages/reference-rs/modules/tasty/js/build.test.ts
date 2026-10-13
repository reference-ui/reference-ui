/**
 * Typescript source file for Reference UI module.
 * Contains JS API logic and types.
 */
import { once } from 'node:events'
import { existsSync, writeFileSync } from 'node:fs'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Worker } from 'node:worker_threads'

import { describe, expect, it } from 'vitest'

import { buildTasty, createTastyBuildSession } from './build'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageDir = join(__dirname, '..', '..')
const tastyDir = join(packageDir, 'tasty', 'tests')

interface PollOptions {
  paths: string[]
  tempParent: string
  tempPrefix: string
}

interface PollReport {
  misses: number
  errors: number
  polls: number
  tempNames: string[]
}

/**
 * Worker body for pollWhile. It stats each path in a busy loop, counting ENOENT misses,
 * and records entries in tempParent starting with tempPrefix, until stopFlag is set.
 */
const POLLING_READER_SOURCE = `
const { parentPort, workerData } = require('node:worker_threads')
const { readdirSync, statSync } = require('node:fs')
const { paths, tempParent, tempPrefix, stopFlag } = workerData
const report = { misses: 0, errors: 0, polls: 0 }
const tempNames = new Set()
do {
  for (const path of paths) {
    report.polls++
    try {
      statSync(path)
    } catch (error) {
      if (error.code === 'ENOENT') report.misses++
      else report.errors++
    }
  }
  try {
    for (const name of readdirSync(tempParent)) {
      if (name.startsWith(tempPrefix)) tempNames.add(name)
    }
  } catch (error) {
    report.errors++
  }
} while (Atomics.load(stopFlag, 0) === 0)
parentPort.postMessage({ ...report, tempNames: [...tempNames] })
`

/** Runs `work` while a worker polls the paths, then returns what the worker saw. */
async function pollWhile(
  options: PollOptions,
  work: () => Promise<void>
): Promise<PollReport> {
  const stopFlag = new Int32Array(new SharedArrayBuffer(4))
  const worker = new Worker(POLLING_READER_SOURCE, {
    eval: true,
    workerData: { ...options, stopFlag },
  })
  await once(worker, 'online')

  try {
    await work()
  } finally {
    Atomics.store(stopFlag, 0, 1)
  }
  // Listening starts in the same tick as the store, so the worker's reply cannot be missed.
  const [report] = (await once(worker, 'message')) as [PollReport]
  await worker.terminate()
  return report
}

/** Maps every file under dir, keyed by its '/'-joined relative path, to its utf-8 contents. */
async function readTree(dir: string, prefix = ''): Promise<Map<string, string>> {
  const tree = new Map<string, string>()
  for (const entry of await readdir(join(dir, prefix), { withFileTypes: true })) {
    const key = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      for (const [nestedKey, contents] of await readTree(dir, key)) {
        tree.set(nestedKey, contents)
      }
    } else {
      tree.set(key, await readFile(join(dir, key), 'utf-8'))
    }
  }
  return tree
}

/** Builds one fixture into outputDir and returns the resulting tree. */
async function buildTree(
  outputDir: string,
  include: string[]
): Promise<Map<string, string>> {
  await buildTasty({ rootDir: tastyDir, include, outputDir })
  return readTree(outputDir)
}

describe('buildTasty', () => {
  it('builds emitted artifacts and returns a ready api', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'reference-ui-tasty-build-'))
    const outputDir = join(tempRoot, 'tasty-output')

    try {
      const built = await buildTasty({
        rootDir: tastyDir,
        include: ['cases/TST-EXT-01/input/**/*.{ts,tsx}'],
        outputDir,
      })

      expect(built.outputDir).toBe(outputDir)
      expect(built.manifestPath).toBe(join(outputDir, 'manifest.js'))
      expect(built.warnings).toEqual([])
      expect(built.diagnostics).toEqual([])
      expect(existsSync(join(outputDir, 'manifest.js'))).toBe(true)
      expect(existsSync(join(outputDir, 'runtime.js'))).toBe(true)
      expect(existsSync(join(outputDir, 'chunk-registry.js'))).toBe(true)

      const symbol = await built.api.loadSymbolByName('ButtonProps')
      expect(symbol.getName()).toBe('ButtonProps')
    } finally {
      await rm(tempRoot, { recursive: true, force: true })
    }
  })

  it('stores build/session cache inside the tasty build layer', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'reference-ui-tasty-session-'))
    const outputDir = join(tempRoot, 'tasty-output')
    const session = createTastyBuildSession()

    try {
      const first = await session.rebuild('fixture', {
        rootDir: tastyDir,
        include: ['cases/TST-EXT-01/input/**/*.{ts,tsx}'],
        outputDir,
      })
      const cached = session.get('fixture')
      const ensured = await session.ensureReady('fixture')
      const reused = await session.getOrRebuild('fixture', {
        rootDir: tastyDir,
        include: ['cases/TST-EXT-01/input/**/*.{ts,tsx}'],
        outputDir,
      })

      expect(cached).toBe(first)
      expect(ensured).toBe(first)
      expect(reused).toBe(first)
    } finally {
      await rm(tempRoot, { recursive: true, force: true })
    }
  })

  it('rebuilds fresh artifacts when source contents change for the same session key', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'reference-ui-tasty-rebuild-inputs-'))
    const rootDir = join(tempRoot, 'workspace')
    const sourceDir = join(rootDir, 'src')
    const outputDir = join(tempRoot, 'tasty-output')
    const session = createTastyBuildSession()

    try {
      await mkdir(sourceDir, { recursive: true })
      await writeFile(
        join(sourceDir, 'config.ts'),
        'export interface BuildConfig {\n  value: string\n}\n',
        'utf-8'
      )

      const first = await session.rebuild('fixture', {
        rootDir,
        include: ['src/**/*.{ts,tsx}'],
        outputDir,
      })
      const firstSymbol = await first.api.loadSymbolByName('BuildConfig')

      await writeFile(
        join(sourceDir, 'config.ts'),
        'export interface BuildConfig {\n  value: number\n}\n',
        'utf-8'
      )

      const second = await session.rebuild('fixture', {
        rootDir,
        include: ['src/**/*.{ts,tsx}'],
        outputDir,
      })
      const secondSymbol = await second.api.loadSymbolByName('BuildConfig')

      expect(first).not.toBe(second)
      expect(firstSymbol.getMembers()[0]?.getType()?.describe()).toBe('string')
      expect(secondSymbol.getMembers()[0]?.getType()?.describe()).toBe('number')
    } finally {
      await rm(tempRoot, { recursive: true, force: true })
    }
  })

  it('a rebuild requested during an in-flight build reflects the later source', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'reference-ui-tasty-inflight-'))
    const rootDir = join(tempRoot, 'workspace')
    const sourceDir = join(rootDir, 'src')
    const outputDir = join(tempRoot, 'tasty-output')
    const configPath = join(sourceDir, 'config.ts')
    const options = { rootDir, include: ['src/**/*.{ts,tsx}'], outputDir }
    const session = createTastyBuildSession()

    try {
      await mkdir(sourceDir, { recursive: true })
      await writeFile(configPath, 'export interface BuildConfig {\n  value: string\n}\n', 'utf-8')

      // A build scans its sources synchronously on call, so the first build reads `string`.
      // The edit and the second request land while it is still in flight, with no
      // event-loop turn between them. The first build's api reads the shared output dir
      // lazily, so only the latest build's symbol is checked.
      const first = session.rebuild('fixture', options)
      writeFileSync(configPath, 'export interface BuildConfig {\n  value: number\n}\n', 'utf-8')
      const second = session.rebuild('fixture', options)

      const [firstBuilt, latest] = await Promise.all([first, second])
      const latestSymbol = await latest.api.loadSymbolByName('BuildConfig')

      expect(latestSymbol.getMembers()[0]?.getType()?.describe()).toBe('number')
      expect(latest).not.toBe(firstBuilt)
      expect(session.get('fixture')).toBe(latest)
    } finally {
      await rm(tempRoot, { recursive: true, force: true })
    }
  })

  it('rebuilds fresh artifacts when include config changes for the same session key', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'reference-ui-tasty-rebuild-config-'))
    const rootDir = join(tempRoot, 'workspace')
    const sourceDir = join(rootDir, 'src')
    const outputDir = join(tempRoot, 'tasty-output')
    const session = createTastyBuildSession()

    try {
      await mkdir(sourceDir, { recursive: true })
      await writeFile(
        join(sourceDir, 'alpha.ts'),
        'export interface AlphaOnly {}\n',
        'utf-8'
      )
      await writeFile(
        join(sourceDir, 'beta.ts'),
        'export interface BetaOnly {}\n',
        'utf-8'
      )

      const first = await session.rebuild('fixture', {
        rootDir,
        include: ['src/alpha.ts'],
        outputDir,
      })
      await expect(first.api.loadSymbolByName('AlphaOnly')).resolves.toMatchObject({
        getName: expect.any(Function),
      })
      await expect(first.api.loadSymbolByName('BetaOnly')).rejects.toThrow(
        'Symbol not found: BetaOnly'
      )

      const second = await session.rebuild('fixture', {
        rootDir,
        include: ['src/beta.ts'],
        outputDir,
      })

      await expect(second.api.loadSymbolByName('AlphaOnly')).rejects.toThrow(
        'Symbol not found: AlphaOnly'
      )
      await expect(second.api.loadSymbolByName('BetaOnly')).resolves.toMatchObject({
        getName: expect.any(Function),
      })
    } finally {
      await rm(tempRoot, { recursive: true, force: true })
    }
  })

  it('exposes structured build diagnostics from scanner and manifest warnings', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'reference-ui-tasty-diagnostics-'))
    const rootDir = join(tempRoot, 'workspace')
    const sourceDir = join(rootDir, 'src')
    const outputDir = join(tempRoot, 'tasty-output')

    try {
      await mkdir(sourceDir, { recursive: true })
      await writeFile(
        join(sourceDir, 'broken.ts'),
        'export interface Broken {\n',
        'utf-8'
      )
      await writeFile(
        join(sourceDir, 'alpha.ts'),
        'export interface Shared {\n  alpha: string\n}\n',
        'utf-8'
      )
      await writeFile(
        join(sourceDir, 'beta.ts'),
        'export interface Shared {\n  beta: number\n}\n',
        'utf-8'
      )

      const built = await buildTasty({
        rootDir,
        include: ['src/**/*.{ts,tsx}'],
        outputDir,
      })

      expect(built.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: 'warning',
            source: 'scanner',
            code: 'TST-W-PARSE-ERROR',
            file: expect.stringContaining('src/broken.ts'),
            message: expect.stringContaining('parse reported'),
          }),
          expect.objectContaining({
            level: 'warning',
            source: 'manifest',
            code: 'TST-W-DUPLICATE-SYMBOL-NAME',
            message: expect.stringContaining('Duplicate symbol name `Shared`'),
          }),
        ])
      )
      expect(
        built.warnings.some(
          warning =>
            warning.code === 'TST-W-DUPLICATE-SYMBOL-NAME' &&
            warning.message.includes('Duplicate symbol name `Shared`')
        )
      ).toBe(true)
    } finally {
      await rm(tempRoot, { recursive: true, force: true })
    }
  })

  /**
   * Creates a temp workspace with two separate scan-root subdirectories, both
   * exporting a symbol named `Shared`, and builds Tasty against both roots.
   * Callers are responsible for deleting `tempRoot` in a finally block.
   */
  async function buildCrossRootSharedFixture(tempPrefix: string) {
    const tempRoot = await mkdtemp(join(tmpdir(), tempPrefix))
    const rootDir = join(tempRoot, 'workspace')
    const outputDir = join(tempRoot, 'tasty-output')

    await mkdir(join(rootDir, 'root-a'), { recursive: true })
    await mkdir(join(rootDir, 'root-b'), { recursive: true })
    await writeFile(
      join(rootDir, 'root-a', 'shared.ts'),
      'export interface Shared {\n  alpha: string\n}\n',
      'utf-8'
    )
    await writeFile(
      join(rootDir, 'root-b', 'shared.ts'),
      'export type Shared = {\n  beta: number\n}\n',
      'utf-8'
    )

    const built = await buildTasty({
      rootDir,
      include: ['root-a/**/*.{ts,tsx}', 'root-b/**/*.{ts,tsx}'],
      outputDir,
    })

    return { tempRoot, built }
  }

  it('emits a duplicate-symbol warning when the same name appears across multiple scan roots', async () => {
    const { tempRoot, built } = await buildCrossRootSharedFixture(
      'reference-ui-tasty-multiroots-dedup-'
    )

    try {
      expect(
        built.warnings.some(
          warning =>
            warning.code === 'TST-W-DUPLICATE-SYMBOL-NAME' &&
            warning.message.includes('Duplicate symbol name `Shared`')
        )
      ).toBe(true)
      expect(
        built.diagnostics.some(
          d =>
            d.source === 'manifest' &&
            d.code === 'TST-W-DUPLICATE-SYMBOL-NAME' &&
            d.message.includes('Duplicate symbol name `Shared`')
        )
      ).toBe(true)
    } finally {
      await rm(tempRoot, { recursive: true, force: true })
    }
  })

  it('preserves all entries and rejects ambiguous bare-name lookup for cross-root duplicates', async () => {
    const { tempRoot, built } = await buildCrossRootSharedFixture(
      'reference-ui-tasty-multiroots-api-'
    )

    try {
      const manifest = await built.api.loadManifest()
      const matches = await built.api.findSymbolsByName('Shared')

      expect(manifest.symbolsByName['Shared']).toHaveLength(2)
      expect(matches).toHaveLength(2)
      expect(matches.map(s => s.name)).toEqual(['Shared', 'Shared'])

      await expect(built.api.loadSymbolByName('Shared')).rejects.toThrow(
        'Ambiguous symbol name "Shared"'
      )
    } finally {
      await rm(tempRoot, { recursive: true, force: true })
    }
  })

  it('resolves cross-root duplicate symbols by id after findSymbolsByName', async () => {
    const { tempRoot, built } = await buildCrossRootSharedFixture(
      'reference-ui-tasty-multiroots-byid-'
    )

    try {
      const matches = await built.api.findSymbolsByName('Shared')
      expect(matches).toHaveLength(2)

      const kinds = matches.map(s => s.kind).sort()
      expect(kinds).toEqual(['interface', 'typeAlias'])

      for (const result of matches) {
        const symbol = await built.api.loadSymbolById(result.id)
        expect(symbol.getId()).toBe(result.id)
        expect(symbol.getName()).toBe(result.name)
      }
    } finally {
      await rm(tempRoot, { recursive: true, force: true })
    }
  })

  it('a polling reader never sees the manifest missing across rebuilds', async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), 'reference-ui-tasty-swap-'))
    const outputDir = join(tempRoot, 'tasty-output')
    const includeA = ['cases/TST-EXT-01/input/**/*.{ts,tsx}']
    const includeB = ['cases/TST-GEN-01/input/**/*.{ts,tsx}']

    try {
      const treeA = await buildTree(join(tempRoot, 'ref-a'), includeA)
      const treeB = await buildTree(join(tempRoot, 'ref-b'), includeB)
      const onlyInB = [...treeB.keys()].filter(key => !treeA.has(key))
      expect(treeB.get('manifest.js')).not.toBe(treeA.get('manifest.js'))
      expect(onlyInB.length).toBeGreaterThan(0)

      // Seed the live dir so the reader starts from a valid manifest.
      await buildTasty({ rootDir: tastyDir, include: includeA, outputDir })

      const report = await pollWhile(
        {
          paths: [join(outputDir, 'manifest.js'), join(outputDir, 'runtime.js')],
          tempParent: tempRoot,
          tempPrefix: 'tasty-output.tmp-',
        },
        async () => {
          for (let index = 0; index < 20; index++) {
            await buildTasty({
              rootDir: tastyDir,
              include: index % 2 === 0 ? includeB : includeA,
              outputDir,
            })
          }
        }
      )

      expect(report.errors).toBe(0)
      expect(report.misses).toBe(0)
      expect(report.polls).toBeGreaterThan(0)

      // Requires at least one sampled temp dir, or the pid check would pass vacuously.
      expect(report.tempNames.length).toBeGreaterThan(0)
      for (const name of report.tempNames) {
        expect(name.startsWith(`tasty-output.tmp-${process.pid}-`)).toBe(true)
      }

      // The last build is fixture A, so fixture B's files must be gone.
      const finalTree = await readTree(outputDir)
      expect([...finalTree.keys()].filter(key => onlyInB.includes(key))).toEqual([])
      expect(finalTree).toEqual(treeA)
      expect((await readdir(tempRoot)).sort()).toEqual(['ref-a', 'ref-b', 'tasty-output'])
    } finally {
      await rm(tempRoot, { recursive: true, force: true })
    }
  }, 60_000)
})
