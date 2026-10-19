/**
 * Exercises the manifest and chunk loaders plus the browser runtime against real and malformed artifacts.
 * Tests artifact emission and runtime loading: the manifest and chunk imports, the browser
 * runtime, and how each loader fails or retries on a malformed module or a transient error.
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  createTastyApi,
  createTastyApiFromManifest,
  createTastyBrowserRuntime,
} from './index.js'
import {
  caseRuntimeDir,
  disposeTastyScratch,
  ensureTastyCaseCompiled,
} from '../tests/harness/helpers.js'

function manifestPath(caseName: string) {
  return join(caseRuntimeDir(caseName), 'manifest.js')
}

function runtimePath(caseName: string) {
  return join(caseRuntimeDir(caseName), 'runtime.js')
}

function toImportSpecifier(artifactPath: string): string {
  return artifactPath.startsWith('file:')
    ? artifactPath
    : pathToFileURL(artifactPath).href
}

describe('tasty runtime', () => {
  beforeAll(async () => {
    await ensureTastyCaseCompiled('TST-EXT-01')
  })

  afterAll(disposeTastyScratch)

  it('emits manifest-plus-chunks artifacts without bundle.js', () => {
    const outputDir = caseRuntimeDir('TST-EXT-01')
    const manifest = join(outputDir, 'manifest.js')
    const runtime = join(outputDir, 'runtime.js')
    const chunkRegistry = join(outputDir, 'chunk-registry.js')
    const manifestTypes = join(outputDir, 'manifest.d.ts')
    const runtimeTypes = join(outputDir, 'runtime.d.ts')
    const chunkDir = join(outputDir, 'chunks')
    const legacyBundle = join(outputDir, 'bundle.js')

    expect(existsSync(manifest)).toBe(true)
    expect(existsSync(runtime)).toBe(true)
    expect(existsSync(chunkRegistry)).toBe(true)
    expect(existsSync(manifestTypes)).toBe(true)
    expect(existsSync(runtimeTypes)).toBe(true)
    expect(existsSync(chunkDir)).toBe(true)
    expect(existsSync(legacyBundle)).toBe(false)
  })

  it('loads only the manifest during ready()', async () => {
    const loads: string[] = []
    const api = createTastyApi({
      manifestPath: manifestPath('TST-EXT-01'),
      importer: async artifactPath => {
        loads.push(artifactPath)
        return import(toImportSpecifier(artifactPath))
      },
    })

    await api.ready()

    expect(loads).toHaveLength(1)
    expect(loads[0]?.endsWith('manifest.js')).toBe(true)
  })

  it('resolves chunk imports relative to the manifest path when created from a manifest object', async () => {
    const manifestModule = await import(toImportSpecifier(manifestPath('TST-EXT-01')))
    const loads: string[] = []
    const api = createTastyApiFromManifest({
      manifest: manifestModule.default,
      manifestPath: manifestPath('TST-EXT-01'),
      importer: async artifactPath => {
        loads.push(artifactPath)
        return import(toImportSpecifier(artifactPath))
      },
    })

    await api.loadSymbolByName('ButtonProps')

    const chunkLoads = loads.filter(artifactPath => artifactPath.includes('/chunks/'))
    expect(chunkLoads).toHaveLength(1)
    expect(chunkLoads[0]?.endsWith('.js')).toBe(true)
  })

  it('creates a browser runtime from the generated runtime module', async () => {
    const runtime = createTastyBrowserRuntime({
      loadRuntimeModule: async () => import(toImportSpecifier(runtimePath('TST-EXT-01'))),
    })

    const api = await runtime.loadApi()
    const symbol = await api.loadSymbolByName('ButtonProps')

    expect(symbol.getName()).toBe('ButtonProps')
    expect(runtime.getApi()).toBe(api)
  })

  it('fails gracefully when the browser runtime module shape is malformed', async () => {
    const runtime = createTastyBrowserRuntime({
      loadRuntimeModule: async () => ({ notManifest: true }),
    })

    await expect(runtime.loadApi()).rejects.toThrow(
      'Malformed Tasty browser runtime module. Expected manifest, manifestUrl, and importTastyArtifact exports.'
    )
  })

  it('fails gracefully when the manifest module shape is malformed', async () => {
    const api = createTastyApi({
      manifestPath: '/tmp/tasty/manifest.js',
      importer: async () => ({ default: { nope: true } }),
    })

    await expect(api.ready()).rejects.toThrow(
      'Malformed Tasty manifest module. Expected a default or manifest export with version, warnings, symbolsByName, and symbolsById.'
    )
  })

  it('does not import the same chunk twice', async () => {
    const loads: string[] = []
    const api = createTastyApi({
      manifestPath: manifestPath('TST-EXT-01'),
      importer: async artifactPath => {
        loads.push(artifactPath)
        return import(toImportSpecifier(artifactPath))
      },
    })

    await api.loadSymbolByName('ButtonProps')
    await api.loadSymbolByName('ButtonProps')

    const chunkLoads = loads.filter(artifactPath => artifactPath.includes('/chunks/'))
    expect(chunkLoads).toHaveLength(1)
  })

  it('retries chunk imports after a transient failure', async () => {
    let failNextChunkLoad = true
    const api = createTastyApi({
      manifestPath: manifestPath('TST-EXT-01'),
      importer: async artifactPath => {
        if (artifactPath.includes('/chunks/') && failNextChunkLoad) {
          failNextChunkLoad = false
          throw new Error('temporary chunk failure')
        }
        return import(toImportSpecifier(artifactPath))
      },
    })

    await expect(api.loadSymbolByName('ButtonProps')).rejects.toThrow(
      'temporary chunk failure'
    )
    await expect(api.loadSymbolByName('ButtonProps')).resolves.toMatchObject({
      getName: expect.any(Function),
    })
  })

  it('fails gracefully when a chunk loads but does not export the requested symbol', async () => {
    const api = createTastyApiFromManifest({
      manifest: {
        version: '2',
        warnings: [],
        symbolsByName: {
          Broken: ['_broken'],
        },
        symbolsById: {
          _broken: {
            id: '_broken',
            name: 'Broken',
            kind: 'interface',
            chunk: './chunks/_broken.js',
            library: 'user',
          },
        },
      },
      manifestPath: '/tmp/tasty/manifest.js',
      importer: async () => ({ default: { id: 'not-the-right-symbol', name: 'Broken' } }),
    })

    await expect(api.loadSymbolByName('Broken')).rejects.toThrow(
      'Missing symbol export in Tasty chunk for id "_broken". Expected a named export "_broken" or a matching default export.'
    )
  })

  it('retries browser runtime initialization after a transient failure', async () => {
    let failNextLoad = true
    const runtime = createTastyBrowserRuntime({
      loadRuntimeModule: async () => {
        if (failNextLoad) {
          failNextLoad = false
          throw new Error('temporary runtime failure')
        }
        return import(toImportSpecifier(runtimePath('TST-EXT-01')))
      },
    })

    await expect(runtime.loadApi()).rejects.toThrow('temporary runtime failure')
    const api = await runtime.loadApi()
    await expect(api.loadSymbolByName('ButtonProps')).resolves.toMatchObject({
      getName: expect.any(Function),
    })
  })
})
