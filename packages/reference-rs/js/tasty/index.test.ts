import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  createTastyApi,
  createTastyApiFromManifest,
  createTastyBrowserRuntime,
} from './index'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageDir = join(__dirname, '..', '..')

function manifestPath(...segments: string[]) {
  return join(packageDir, 'tests', 'tasty', 'cases', ...segments, 'output', 'manifest.js')
}

function runtimePath(...segments: string[]) {
  return join(packageDir, 'tests', 'tasty', 'cases', ...segments, 'output', 'runtime.js')
}

function toImportSpecifier(artifactPath: string): string {
  return artifactPath.startsWith('file:') ? artifactPath : pathToFileURL(artifactPath).href
}

describe('tasty runtime', () => {
  it('emits manifest-plus-chunks artifacts without bundle.js', () => {
    const outputDir = join(packageDir, 'tests', 'tasty', 'cases', 'external_libs', 'output')
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
      manifestPath: manifestPath('external_libs'),
      importer: async (artifactPath) => {
        loads.push(artifactPath)
        return import(toImportSpecifier(artifactPath))
      },
    })

    await api.ready()

    expect(loads).toHaveLength(1)
    expect(loads[0]?.endsWith('manifest.js')).toBe(true)
  })

  it('resolves chunk imports relative to the manifest path when created from a manifest object', async () => {
    const manifestModule = await import(toImportSpecifier(manifestPath('external_libs')))
    const loads: string[] = []
    const api = createTastyApiFromManifest({
      manifest: manifestModule.default,
      manifestPath: manifestPath('external_libs'),
      importer: async (artifactPath) => {
        loads.push(artifactPath)
        return import(toImportSpecifier(artifactPath))
      },
    })

    await api.loadSymbolByName('ButtonProps')

    const chunkLoads = loads.filter((artifactPath) => artifactPath.includes('/chunks/'))
    expect(chunkLoads).toHaveLength(1)
    expect(chunkLoads[0]?.endsWith('.js')).toBe(true)
  })

  it('creates a browser runtime from the generated runtime module', async () => {
    const runtime = createTastyBrowserRuntime({
      loadRuntimeModule: async () => import(toImportSpecifier(runtimePath('external_libs'))),
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

  it('rejects ambiguous bare-name lookup and supports scoped-name lookup', async () => {
    const api = createTastyApiFromManifest({
      manifest: {
        version: '2',
        warnings: ['Duplicate symbol name "Shared" matched 2 entries.'],
        symbolsByName: {
          Shared: ['_alpha', '_beta'],
        },
        symbolsById: {
          _alpha: {
            id: '_alpha',
            name: 'Shared',
            kind: 'interface',
            chunk: './chunks/_alpha.js',
            library: 'alpha-lib',
          },
          _beta: {
            id: '_beta',
            name: 'Shared',
            kind: 'typeAlias',
            chunk: './chunks/_beta.js',
            library: 'beta-lib',
          },
        },
      },
      importer: async (artifactPath) => {
        if (artifactPath.includes('_alpha')) {
          return {
            _alpha: {
              id: '_alpha',
              name: 'Shared',
              library: 'alpha-lib',
              members: [],
              extends: [],
              types: [],
            },
          }
        }

        if (artifactPath.includes('_beta')) {
          return {
            _beta: {
              id: '_beta',
              name: 'Shared',
              library: 'beta-lib',
              definition: { kind: 'intrinsic', name: 'string' },
            },
          }
        }

        throw new Error(`Unexpected artifact path: ${artifactPath}`)
      },
    })

    await expect(api.loadSymbolByName('Shared')).rejects.toThrow('Ambiguous symbol name "Shared"')
    expect(await api.findSymbolsByName('Shared')).toHaveLength(2)

    const alpha = await api.loadSymbolByScopedName('alpha-lib', 'Shared')
    const beta = await api.loadSymbolByScopedName('beta-lib', 'Shared')

    expect(alpha.getId()).toBe('_alpha')
    expect(beta.getId()).toBe('_beta')
    expect(api.getWarnings()).toEqual(['Duplicate symbol name "Shared" matched 2 entries.'])
  })

  it('keeps symbol wrapper identity stable across lookup paths', async () => {
    const api = createTastyApi({
      manifestPath: manifestPath('external_libs'),
    })

    const byName = await api.loadSymbolByName('ButtonProps')
    const byId = await api.loadSymbolById(byName.getId())

    expect(byId).toBe(byName)
  })

  it('does not import the same chunk twice', async () => {
    const loads: string[] = []
    const api = createTastyApi({
      manifestPath: manifestPath('external_libs'),
      importer: async (artifactPath) => {
        loads.push(artifactPath)
        return import(toImportSpecifier(artifactPath))
      },
    })

    await api.loadSymbolByName('ButtonProps')
    await api.loadSymbolByName('ButtonProps')

    const chunkLoads = loads.filter((artifactPath) => artifactPath.includes('/chunks/'))
    expect(chunkLoads).toHaveLength(1)
  })

  it('retries chunk imports after a transient failure', async () => {
    let failNextChunkLoad = true
    const api = createTastyApi({
      manifestPath: manifestPath('external_libs'),
      importer: async (artifactPath) => {
        if (artifactPath.includes('/chunks/') && failNextChunkLoad) {
          failNextChunkLoad = false
          throw new Error('temporary chunk failure')
        }
        return import(toImportSpecifier(artifactPath))
      },
    })

    await expect(api.loadSymbolByName('ButtonProps')).rejects.toThrow('temporary chunk failure')
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
        return import(toImportSpecifier(runtimePath('external_libs')))
      },
    })

    await expect(runtime.loadApi()).rejects.toThrow('temporary runtime failure')
    const api = await runtime.loadApi()
    await expect(api.loadSymbolByName('ButtonProps')).resolves.toMatchObject({
      getName: expect.any(Function),
    })
  })

  it('loads extends symbols and flattens inherited members', async () => {
    const api = createTastyApi({
      manifestPath: manifestPath('external_libs'),
    })

    const buttonProps = await api.loadSymbolByName('ButtonProps')
    const extendsSymbols = await buttonProps.loadExtendsSymbols()
    const flattened = await api.graph.flattenInterfaceMembers(buttonProps)

    expect(extendsSymbols.map((symbol) => symbol.getName())).toEqual(['StyleProps'])
    expect(flattened.map((member) => member.getName())).toContain('tone')
    expect(flattened.map((member) => member.getName())).toContain('size')
  })

  it('collects only user-owned immediate dependencies', async () => {
    const api = createTastyApi({
      manifestPath: manifestPath('external_libs'),
    })

    const buttonProps = await api.loadSymbolByName('ButtonProps')
    const refs = await api.graph.collectUserOwnedReferences(buttonProps)
    const dependencies = await api.graph.loadImmediateDependencies(buttonProps)

    expect(refs.map((ref) => ref.getName()).sort()).toEqual(['Size', 'StyleProps'])
    expect(dependencies.map((symbol) => symbol.getName()).sort()).toEqual(['Size', 'StyleProps'])
  })

  it('exposes type-alias helpers over the emitted definition shape', async () => {
    const api = createTastyApi({
      manifestPath: manifestPath('default_params'),
    })

    const withDefault = await api.loadSymbolByName('WithDefault')
    const underlying = withDefault.getUnderlyingType()
    const defaultType = withDefault.getTypeParameters()[0]?.default

    expect(withDefault.getKind()).toBe('typeAlias')
    expect(withDefault.getTypeParameters()).toHaveLength(1)
    expect(defaultType).toMatchObject({ kind: 'intrinsic' })
    expect(underlying?.getKind()).toBe('object')
    expect(underlying?.describe()).toBe('{ ... }')
  })

  it('supports simple symbol search over the loaded manifest', async () => {
    const api = createTastyApi({
      manifestPath: manifestPath('external_libs'),
    })

    const results = await api.searchSymbols('button')

    expect(results.map((result) => result.name)).toEqual(['ButtonProps', 'ButtonSchema'])
  })

  it('exposes clean jsdoc and signature helpers for docs renderers', async () => {
    const api = createTastyApi({
      manifestPath: manifestPath('jsdoc'),
    })

    const buttonProps = await api.loadSymbolByName('ButtonProps')
    const size = buttonProps.getMembers().find((member) => member.getName() === 'size')

    expect(buttonProps.getDescription()).toBe('Props for a button.\n\nIncludes common sizing options.')
    expect(buttonProps.getJsDocTags().map((tag) => tag.getName())).toEqual(['deprecated', 'remarks'])
    expect(buttonProps.getJsDocTag('deprecated')?.getValue()).toBe('Use NewButtonProps instead.')
    expect(size?.getDescription()).toBe('Preferred size variant.')
    expect(size?.getJsDocTag('default')?.getValue()).toBe('"sm"')
  })
})
