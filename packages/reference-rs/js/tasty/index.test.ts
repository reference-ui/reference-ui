import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { describe, expect, it } from 'vitest'

import { createTastyApi, createTastyApiFromManifest } from './index'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageDir = join(__dirname, '..', '..')

function manifestPath(...segments: string[]) {
  return join(packageDir, 'tests', 'tasty', 'cases', ...segments, 'output', 'manifest.js')
}

function toImportSpecifier(artifactPath: string): string {
  return artifactPath.startsWith('file:') ? artifactPath : pathToFileURL(artifactPath).href
}

describe('tasty runtime', () => {
  it('emits manifest-plus-chunks artifacts without bundle.js', () => {
    const outputDir = join(packageDir, 'tests', 'tasty', 'cases', 'external_libs', 'output')
    const manifest = join(outputDir, 'manifest.js')
    const runtime = join(outputDir, 'runtime.js')
    const manifestTypes = join(outputDir, 'manifest.d.ts')
    const runtimeTypes = join(outputDir, 'runtime.d.ts')
    const chunkDir = join(outputDir, 'chunks')
    const legacyBundle = join(outputDir, 'bundle.js')

    expect(existsSync(manifest)).toBe(true)
    expect(existsSync(runtime)).toBe(true)
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

    expect(withDefault.getKind()).toBe('typeAlias')
    expect(withDefault.getTypeParameters()).toHaveLength(1)
    expect(withDefault.getTypeParameters()[0]?.default?.kind).toBe('intrinsic')
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
})
