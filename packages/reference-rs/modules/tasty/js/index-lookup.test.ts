/**
 * Typescript source file for Reference UI module.
 * Tests symbol lookup over the tasty runtime: ambiguous bare names, precedence between a user
 * symbol and external libraries, symbol wrapper identity, and search over the manifest.
 */
import { join } from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createTastyApi, createTastyApiFromManifest } from './index.js'
import {
  caseRuntimeDir,
  disposeTastyScratch,
  ensureTastyCaseCompiled,
} from '../tests/harness/helpers.js'

function manifestPath(caseName: string) {
  return join(caseRuntimeDir(caseName), 'manifest.js')
}

describe('tasty runtime', () => {
  beforeAll(async () => {
    await ensureTastyCaseCompiled('TST-EXT-01')
  })

  afterAll(disposeTastyScratch)

  it('resolves ambiguous external bare-name lookup when caller preferences are configured', async () => {
    const api = createTastyApiFromManifest({
      preferredExternalLibraries: ['alpha-lib'],
      manifest: {
        version: '2',
        warnings: [
          {
            severity: 'warning',
            code: 'TST-W-DUPLICATE-SYMBOL-NAME',
            message: 'Duplicate symbol name `Shared` matched 2 entries.',
          },
        ],
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
      importer: async artifactPath => {
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
      {
        severity: 'warning',
        code: 'TST-W-DUPLICATE-SYMBOL-NAME',
        message: 'Duplicate symbol name `Shared` matched 2 entries.',
      },
    ])
    expect(api.getRuntimeNotices()).toEqual([
      'Ambiguous symbol name "Shared" matched multiple external libraries. Using _alpha (alpha-lib); other matches: _beta (beta-lib). Use a scoped lookup to disambiguate.',
    ])
  })

  it('prefers a unique user symbol over external bare-name matches', async () => {
    const api = createTastyApiFromManifest({
      manifest: {
        version: '2',
        warnings: [],
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
      importer: async artifactPath => {
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

    await expect(api.loadSymbolByName('Shared')).resolves.toMatchObject({
      getId: expect.any(Function),
      getLibrary: expect.any(Function),
    })

    const shared = await api.loadSymbolByName('Shared')
    const beta = await api.loadSymbolByScopedName('beta-lib', 'Shared')

    expect(shared.getId()).toBe('_user')
    expect(shared.getLibrary()).toBe('user')
    expect(beta.getId()).toBe('_beta')
    expect(api.getWarnings()).toEqual([])
  })

  it('prefers configured external libraries for known duplicate names', async () => {
    const api = createTastyApiFromManifest({
      preferredExternalLibraries: ['@reference-ui/react', '@reference-ui/system'],
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
      importer: async artifactPath => {
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
    expect(api.getWarnings()).toEqual([])
    expect(api.getRuntimeNotices()).toEqual([
      'Ambiguous symbol name "StyleProps" matched multiple external libraries. Using _react (@reference-ui/react); other matches: _system (@reference-ui/system), _types (@reference-ui/types). Use a scoped lookup to disambiguate.',
    ])
  })

  it('keeps symbol wrapper identity stable across lookup paths', async () => {
    const api = createTastyApi({
      manifestPath: manifestPath('TST-EXT-01'),
    })

    const byName = await api.loadSymbolByName('ButtonProps')
    const byId = await api.loadSymbolById(byName.getId())

    expect(byId).toBe(byName)
  })

  it('supports simple symbol search over the loaded manifest', async () => {
    const api = createTastyApi({
      manifestPath: manifestPath('TST-EXT-01'),
    })

    const results = await api.searchSymbols('button')

    expect(results.map(result => result.name)).toEqual(['ButtonProps', 'ButtonSchema'])
  })
})
