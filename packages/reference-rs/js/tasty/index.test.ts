import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  createTastyApi,
  createTastyApiFromManifest,
  createTastyBrowserRuntime,
} from './index'
import type { RawTastyManifest } from './api-types'

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

  it('auto-resolves ambiguous external bare-name lookup and supports scoped-name lookup', async () => {
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

    const shared = await api.loadSymbolByName('Shared')
    expect(await api.findSymbolsByName('Shared')).toHaveLength(2)

    const alpha = await api.loadSymbolByScopedName('alpha-lib', 'Shared')
    const beta = await api.loadSymbolByScopedName('beta-lib', 'Shared')

    expect(shared.getId()).toBe('_alpha')
    expect(alpha.getId()).toBe('_alpha')
    expect(beta.getId()).toBe('_beta')
    expect(api.getWarnings()).toEqual([
      'Duplicate symbol name "Shared" matched 2 entries.',
      'Ambiguous symbol name "Shared" matched multiple external libraries. Using _alpha (alpha-lib); other matches: _beta (beta-lib). Use a scoped lookup to disambiguate.',
    ])
  })

  it('still rejects ambiguous bare-name lookup when user symbols are involved', async () => {
    const api = createTastyApiFromManifest({
      manifest: {
        version: '2',
        warnings: ['Duplicate symbol name "Shared" matched 2 entries.'],
        symbolsByName: {
          Shared: ['_user', '_beta'],
        },
        symbolsById: {
          _user: {
            id: '_user',
            name: 'Shared',
            kind: 'interface',
            chunk: './chunks/_user.js',
            library: 'user',
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
        if (artifactPath.includes('_user')) {
          return {
            _user: {
              id: '_user',
              name: 'Shared',
              library: 'user',
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
  })

  it('prefers @reference-ui/react for known external duplicate names', async () => {
    const api = createTastyApiFromManifest({
      manifest: {
        version: '2',
        warnings: [],
        symbolsByName: {
          StyleProps: ['_react', '_system', '_types'],
        },
        symbolsById: {
          _react: {
            id: '_react',
            name: 'StyleProps',
            kind: 'typeAlias',
            chunk: './chunks/_react.js',
            library: '@reference-ui/react',
          },
          _system: {
            id: '_system',
            name: 'StyleProps',
            kind: 'typeAlias',
            chunk: './chunks/_system.js',
            library: '@reference-ui/system',
          },
          _types: {
            id: '_types',
            name: 'StyleProps',
            kind: 'typeAlias',
            chunk: './chunks/_types.js',
            library: '@reference-ui/types',
          },
        },
      },
      importer: async (artifactPath) => {
        if (artifactPath.includes('_react')) {
          return {
            _react: {
              id: '_react',
              name: 'StyleProps',
              library: '@reference-ui/react',
              definition: { kind: 'intrinsic', name: 'string' },
            },
          }
        }

        if (artifactPath.includes('_system')) {
          return {
            _system: {
              id: '_system',
              name: 'StyleProps',
              library: '@reference-ui/system',
              definition: { kind: 'intrinsic', name: 'number' },
            },
          }
        }

        if (artifactPath.includes('_types')) {
          return {
            _types: {
              id: '_types',
              name: 'StyleProps',
              library: '@reference-ui/types',
              definition: { kind: 'intrinsic', name: 'boolean' },
            },
          }
        }

        throw new Error(`Unexpected artifact path: ${artifactPath}`)
      },
    })

    const styleProps = await api.loadSymbolByName('StyleProps')

    expect(styleProps.getId()).toBe('_react')
    expect(api.getWarnings()).toEqual([
      'Ambiguous symbol name "StyleProps" matched multiple external libraries. Using _react (@reference-ui/react); other matches: _system (@reference-ui/system), _types (@reference-ui/types). Use a scoped lookup to disambiguate.',
    ])
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
    const displayMembers = await api.graph.getDisplayMembers(buttonProps)

    expect(extendsSymbols.map((symbol) => symbol.getName())).toEqual(['StyleProps'])
    expect(flattened.map((member) => member.getName())).toContain('tone')
    expect(flattened.map((member) => member.getName())).toContain('size')
    expect(displayMembers.map((member) => member.getName())).toContain('tone')
    expect(displayMembers.map((member) => member.getName())).toContain('size')
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

  it('projects object-like aliases while tolerating partially opaque intersection inputs', async () => {
    const manifest: RawTastyManifest = {
      version: '2',
      warnings: [],
      symbolsByName: {
        BaseProps: ['base'],
        PatternProps: ['pattern'],
        OpaqueMappedProps: ['opaqueMapped'],
        PartialProjectedProps: ['partialProjected'],
        ProjectedProps: ['projected'],
        PublicProjectedProps: ['publicProjected'],
      },
      symbolsById: {
        base: { id: 'base', name: 'BaseProps', kind: 'interface', chunk: './chunks/base.js', library: 'user' },
        pattern: { id: 'pattern', name: 'PatternProps', kind: 'typeAlias', chunk: './chunks/pattern.js', library: 'user' },
        opaqueMapped: {
          id: 'opaqueMapped',
          name: 'OpaqueMappedProps',
          kind: 'typeAlias',
          chunk: './chunks/opaque-mapped.js',
          library: 'user',
        },
        partialProjected: {
          id: 'partialProjected',
          name: 'PartialProjectedProps',
          kind: 'typeAlias',
          chunk: './chunks/partial-projected.js',
          library: 'user',
        },
        projected: { id: 'projected', name: 'ProjectedProps', kind: 'typeAlias', chunk: './chunks/projected.js', library: 'user' },
        publicProjected: {
          id: 'publicProjected',
          name: 'PublicProjectedProps',
          kind: 'typeAlias',
          chunk: './chunks/public-projected.js',
          library: 'user',
        },
      },
    }

    const chunks = {
      './chunks/base.js': {
        base: {
          id: 'base',
          name: 'BaseProps',
          library: 'user',
          members: [
            { name: 'tone', optional: true, readonly: false, kind: 'property', type: { kind: 'intrinsic', name: 'string' } },
            { name: 'size', optional: true, readonly: false, kind: 'property', type: { kind: 'intrinsic', name: 'number' } },
            { name: 'color', optional: true, readonly: false, kind: 'property', type: { kind: 'intrinsic', name: 'string' } },
          ],
          extends: [],
          types: [],
        },
      },
      './chunks/pattern.js': {
        pattern: {
          id: 'pattern',
          name: 'PatternProps',
          library: 'user',
          definition: {
            kind: 'object',
            members: [
              { name: 'gap', optional: true, readonly: false, kind: 'property', type: { kind: 'intrinsic', name: 'string' } },
            ],
          },
        },
      },
      './chunks/projected.js': {
        projected: {
          id: 'projected',
          name: 'ProjectedProps',
          library: 'user',
          definition: {
            kind: 'intersection',
            types: [
              {
                id: 'Omit',
                name: 'Omit',
                library: 'typescript',
                typeArguments: [
                  { id: 'base', name: 'BaseProps', library: 'user' },
                  {
                    kind: 'union',
                    types: [
                      { kind: 'literal', value: "'color'" },
                    ],
                  },
                ],
              },
              { id: 'pattern', name: 'PatternProps', library: 'user' },
            ],
          },
        },
      },
      './chunks/opaque-mapped.js': {
        opaqueMapped: {
          id: 'opaqueMapped',
          name: 'OpaqueMappedProps',
          library: 'user',
          definition: {
            kind: 'mapped',
            typeParam: 'K',
            sourceType: { kind: 'intrinsic', name: 'string' },
            optionalModifier: 'preserve',
            readonlyModifier: 'preserve',
            valueType: { kind: 'intrinsic', name: 'string' },
          },
        },
      },
      './chunks/partial-projected.js': {
        partialProjected: {
          id: 'partialProjected',
          name: 'PartialProjectedProps',
          library: 'user',
          definition: {
            kind: 'intersection',
            types: [
              { id: 'pattern', name: 'PatternProps', library: 'user' },
              { id: 'opaqueMapped', name: 'OpaqueMappedProps', library: 'user' },
            ],
          },
        },
      },
      './chunks/public-projected.js': {
        publicProjected: {
          id: 'publicProjected',
          name: 'PublicProjectedProps',
          library: 'user',
          definition: { id: 'projected', name: 'ProjectedProps', library: 'user' },
        },
      },
    } as const

    const api = createTastyApiFromManifest({
      manifest,
      importer: async (artifactPath) => chunks[artifactPath as keyof typeof chunks],
    })

    const projected = await api.loadSymbolByName('ProjectedProps')
    const partialProjected = await api.loadSymbolByName('PartialProjectedProps')
    const publicProjected = await api.loadSymbolByName('PublicProjectedProps')
    const projectedDisplayMembers = await api.graph.getDisplayMembers(projected)
    const partialProjectedDisplayMembers = await api.graph.getDisplayMembers(partialProjected)
    const publicProjectedDisplayMembers = await api.graph.getDisplayMembers(publicProjected)
    const projectedMembers = await api.graph.projectObjectLikeMembers(projected)
    const partialProjectedMembers = await api.graph.projectObjectLikeMembers(partialProjected)
    const publicProjectedMembers = await api.graph.projectObjectLikeMembers(publicProjected)
    const projectedMembersFromSymbol = await projected.getDisplayMembers()
    const partialProjectedMembersFromSymbol = await partialProjected.getDisplayMembers()
    const publicProjectedMembersFromSymbol = await publicProjected.getDisplayMembers()

    expect(projectedDisplayMembers.map((member) => member.getName())).toEqual(['tone', 'size', 'gap'])
    expect(partialProjectedDisplayMembers.map((member) => member.getName())).toEqual(['gap'])
    expect(publicProjectedDisplayMembers.map((member) => member.getName())).toEqual(['tone', 'size', 'gap'])
    expect(projectedMembers?.map((member) => member.getName())).toEqual(['tone', 'size', 'gap'])
    expect(partialProjectedMembers?.map((member) => member.getName())).toEqual(['gap'])
    expect(publicProjectedMembers?.map((member) => member.getName())).toEqual(['tone', 'size', 'gap'])
    expect(projectedMembersFromSymbol?.map((member) => member.getName())).toEqual(['tone', 'size', 'gap'])
    expect(partialProjectedMembersFromSymbol?.map((member) => member.getName())).toEqual(['gap'])
    expect(publicProjectedMembersFromSymbol?.map((member) => member.getName())).toEqual(['tone', 'size', 'gap'])
    expect(projected.getMembers()).toEqual([])
    expect(partialProjected.getMembers()).toEqual([])
    expect(publicProjected.getMembers()).toEqual([])
  })

  it(
    'projects utility-based intersections when a utility type is referenced through a re-exporting library',
    async () => {
      const manifest: RawTastyManifest = {
        version: '2',
        warnings: [],
        symbolsByName: {
          ButtonProps: ['button'],
          'React.ComponentPropsWithoutRef': ['componentPropsWithoutRef'],
          RecipeVariantProps: ['recipeVariantProps'],
        },
        symbolsById: {
          button: {
            id: 'button',
            name: 'ButtonProps',
            kind: 'typeAlias',
            chunk: './chunks/button.js',
            library: 'user',
          },
          componentPropsWithoutRef: {
            id: 'componentPropsWithoutRef',
            name: 'React.ComponentPropsWithoutRef',
            kind: 'typeAlias',
            chunk: './chunks/component-props-without-ref.js',
            library: 'user',
          },
          recipeVariantProps: {
            id: 'recipeVariantProps',
            name: 'RecipeVariantProps',
            kind: 'typeAlias',
            chunk: './chunks/recipe-variant-props.js',
            library: '@reference-ui/styled',
          },
        },
      }

      const chunks = {
        './chunks/button.js': {
          button: {
            id: 'button',
            name: 'ButtonProps',
            library: 'user',
            definition: {
              kind: 'intersection',
              types: [
                {
                  id: 'React.ComponentPropsWithoutRef',
                  name: 'React.ComponentPropsWithoutRef',
                  library: 'user',
                  typeArguments: [{ kind: 'type_query', expression: 'ButtonPrimitive' }],
                },
                {
                  id: 'RecipeVariantProps',
                  name: 'RecipeVariantProps',
                  library: '@reference-ui/react',
                  typeArguments: [{ kind: 'type_query', expression: 'buttonRecipe' }],
                },
              ],
            },
          },
        },
        './chunks/component-props-without-ref.js': {
          componentPropsWithoutRef: {
            id: 'componentPropsWithoutRef',
            name: 'React.ComponentPropsWithoutRef',
            library: 'user',
            definition: {
              kind: 'object',
              members: [
                {
                  name: 'disabled',
                  optional: true,
                  readonly: false,
                  kind: 'property',
                  type: { kind: 'intrinsic', name: 'boolean' },
                },
                {
                  name: 'className',
                  optional: true,
                  readonly: false,
                  kind: 'property',
                  type: { kind: 'intrinsic', name: 'string' },
                },
              ],
            },
          },
        },
        './chunks/recipe-variant-props.js': {
          recipeVariantProps: {
            id: 'recipeVariantProps',
            name: 'RecipeVariantProps',
            library: '@reference-ui/styled',
            definition: {
              kind: 'object',
              members: [
                {
                  name: 'visual',
                  optional: true,
                  readonly: false,
                  kind: 'property',
                  type: { kind: 'intrinsic', name: 'string' },
                },
                {
                  name: 'size',
                  optional: true,
                  readonly: false,
                  kind: 'property',
                  type: { kind: 'intrinsic', name: 'string' },
                },
              ],
            },
          },
        },
      } as const

      const api = createTastyApiFromManifest({
        manifest,
        importer: async artifactPath => chunks[artifactPath as keyof typeof chunks],
      })

      const buttonProps = await api.loadSymbolByName('ButtonProps')
      const displayMembers = await api.graph.getDisplayMembers(buttonProps)

      expect(displayMembers.map(member => member.getName())).toEqual([
        'disabled',
        'className',
        'visual',
        'size',
      ])
    }
  )

  it('projects Pretty<Parameters<typeof recipe>[0]> through resolved type-query call signatures', async () => {
    const manifest: RawTastyManifest = {
      version: '2',
      warnings: [],
      symbolsByName: {
        ButtonProps: ['button'],
        RecipeVariantProps: ['recipeVariantProps'],
      },
      symbolsById: {
        button: {
          id: 'button',
          name: 'ButtonProps',
          kind: 'typeAlias',
          chunk: './chunks/button.js',
          library: 'user',
        },
        recipeVariantProps: {
          id: 'recipeVariantProps',
          name: 'RecipeVariantProps',
          kind: 'typeAlias',
          chunk: './chunks/recipe-variant-props.js',
          library: '@reference-ui/styled',
        },
      },
    }

    const chunks = {
      './chunks/button.js': {
        button: {
          id: 'button',
          name: 'ButtonProps',
          library: 'user',
          definition: {
            id: 'RecipeVariantProps',
            name: 'RecipeVariantProps',
            library: '@reference-ui/react',
            typeArguments: [
              {
                kind: 'type_query',
                expression: 'buttonRecipe',
                resolved: {
                  kind: 'function',
                  params: [
                    {
                      name: 'props',
                      optional: true,
                      typeRef: {
                        kind: 'object',
                        members: [
                          {
                            name: 'visual',
                            optional: true,
                            readonly: false,
                            kind: 'property',
                            type: {
                              kind: 'union',
                              types: [
                                { kind: 'literal', value: "'solid'" },
                                { kind: 'literal', value: "'ghost'" },
                              ],
                            },
                          },
                          {
                            name: 'size',
                            optional: true,
                            readonly: false,
                            kind: 'property',
                            type: {
                              kind: 'union',
                              types: [
                                { kind: 'literal', value: "'sm'" },
                                { kind: 'literal', value: "'md'" },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                  returnType: { kind: 'intrinsic', name: 'string' },
                },
              },
            ],
          },
        },
      },
      './chunks/recipe-variant-props.js': {
        recipeVariantProps: {
          id: 'recipeVariantProps',
          name: 'RecipeVariantProps',
          library: '@reference-ui/styled',
          definition: {
            id: 'Pretty',
            name: 'Pretty',
            library: './system-types',
            typeArguments: [
              {
                kind: 'indexed_access',
                object: {
                  id: 'Parameters',
                  name: 'Parameters',
                  library: '@reference-ui/styled/types/recipe',
                  typeArguments: [
                    {
                      kind: 'type_query',
                      expression: 'buttonRecipe',
                      resolved: {
                        kind: 'function',
                        params: [
                          {
                            name: 'props',
                            optional: true,
                            typeRef: {
                              kind: 'object',
                              members: [
                                {
                                  name: 'visual',
                                  optional: true,
                                  readonly: false,
                                  kind: 'property',
                                  type: {
                                    kind: 'union',
                                    types: [
                                      { kind: 'literal', value: "'solid'" },
                                      { kind: 'literal', value: "'ghost'" },
                                    ],
                                  },
                                },
                                {
                                  name: 'size',
                                  optional: true,
                                  readonly: false,
                                  kind: 'property',
                                  type: {
                                    kind: 'union',
                                    types: [
                                      { kind: 'literal', value: "'sm'" },
                                      { kind: 'literal', value: "'md'" },
                                    ],
                                  },
                                },
                              ],
                            },
                          },
                        ],
                        returnType: { kind: 'intrinsic', name: 'string' },
                      },
                    },
                  ],
                },
                index: { kind: 'literal', value: '0' },
              },
            ],
          },
        },
      },
    } as const

    const api = createTastyApiFromManifest({
      manifest,
      importer: async artifactPath => chunks[artifactPath as keyof typeof chunks],
    })

    const buttonProps = await api.loadSymbolByName('ButtonProps')
    const displayMembers = await api.graph.getDisplayMembers(buttonProps)

    expect(displayMembers.map(member => member.getName())).toEqual(['visual', 'size'])
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
