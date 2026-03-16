import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { expect, it } from 'vitest'

import {
  createTastyApi,
  type CreateTastyApiOptions,
  type TastyApi,
  type TastyMember,
  type TastySymbol,
} from '../../js/tasty/index'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageDir = join(__dirname, '..', '..')

export function caseManifestPath(caseName: string) {
  return join(packageDir, 'tests', 'tasty', 'cases', caseName, 'output', 'manifest.js')
}

export function createCaseApi(
  caseName: string,
  overrides: Partial<CreateTastyApiOptions> = {}
): TastyApi {
  return createTastyApi({
    manifestPath: caseManifestPath(caseName),
    ...overrides,
  })
}

function toImportSpecifier(artifactPath: string): string {
  return artifactPath.startsWith('file:') ? artifactPath : pathToFileURL(artifactPath).href
}

export function addCaseRuntimeSmokeTests(caseName: string, symbolName: string) {
  it('loads only the manifest during ready()', async () => {
    const loads: string[] = []
    const api = createCaseApi(caseName, {
      importer: async (artifactPath) => {
        loads.push(artifactPath)
        return import(toImportSpecifier(artifactPath))
      },
    })

    await api.ready()

    expect(loads).toHaveLength(1)
    expect(loads[0]?.endsWith('manifest.js')).toBe(true)
  })

  it('keeps symbol wrapper identity stable across lookup paths', async () => {
    const api = createCaseApi(caseName)
    const byName = await api.loadSymbolByName(symbolName)
    const byId = await api.loadSymbolById(byName.getId())

    expect(byId).toBe(byName)
  })
}

export function findMember(symbol: TastySymbol, memberName: string): TastyMember {
  const member = symbol.getMembers().find((item) => item.getName() === memberName)
  if (!member) {
    throw new Error(`Member not found on ${symbol.getName()}: ${memberName}`)
  }
  return member
}
