/**
 * Typescript source file for Reference UI module.
 * Tests buildTasty and the build session: emitted artifacts, session caching, and rebuilds when
 * the sources or the include config change for the same session key.
 */
import { existsSync, writeFileSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { buildTasty, createTastyBuildSession } from './build.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageDir = join(__dirname, '..', '..')
const tastyDir = join(packageDir, 'tasty', 'tests')

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
      await writeFile(
        configPath,
        'export interface BuildConfig {\n  value: string\n}\n',
        'utf-8'
      )

      // A build scans its sources synchronously on call, so the first build reads `string`.
      // The edit and the second request land while it is still in flight, with no
      // event-loop turn between them. The first build's api reads the shared output dir
      // lazily, so only the latest build's symbol is checked.
      const first = session.rebuild('fixture', options)
      writeFileSync(
        configPath,
        'export interface BuildConfig {\n  value: number\n}\n',
        'utf-8'
      )
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
})
