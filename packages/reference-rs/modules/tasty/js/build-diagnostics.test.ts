/**
 * Typescript source file for Reference UI module.
 * Tests structured build diagnostics and cross-root duplicate symbols: scanner and manifest
 * warnings in one list, and ambiguous bare-name lookup across scan roots that share a name.
 */
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { buildTasty } from './build.js'

describe('buildTasty', () => {
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
})
