import { readFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  createTastyApi,
  type CreateTastyApiOptions,
  type TastyApi,
  type TastyMember,
  type TastySymbol,
} from '../../js/tasty/index'

export type { CreateTastyApiOptions, TastyApi, TastyMember, TastySymbol } from '../../js/tasty/index'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageDir = join(__dirname, '..', '..')

/** Build a map from emitted 16-hex ids to stable placeholders (sorted by symbol name, then id). */
function buildStableEmittedIdMap(manifestJs: string): Map<string, string> {
  const prefix = 'export const manifest = '
  const start = manifestJs.indexOf(prefix)
  if (start === -1) {
    return new Map()
  }
  const jsonStart = start + prefix.length
  const exportDefaultAt = manifestJs.indexOf('\nexport default', jsonStart)
  if (exportDefaultAt === -1) {
    return new Map()
  }
  let jsonText = manifestJs.slice(jsonStart, exportDefaultAt).trimEnd()
  if (jsonText.endsWith(';')) {
    jsonText = jsonText.slice(0, -1).trimEnd()
  }
  const obj = JSON.parse(jsonText) as {
    symbolsById: Record<string, { name: string }>
  }
  const map = new Map<string, string>()
  const sorted = Object.entries(obj.symbolsById).sort((a, b) => {
    const na = a[1].name
    const nb = b[1].name
    return na.localeCompare(nb) || a[0].localeCompare(b[0])
  })
  sorted.forEach(([hash], i) => {
    map.set(hash, `_s${i}`)
  })
  return map
}

/** Replace hash ids and `./chunks/_hash.js` paths using {@link buildStableEmittedIdMap}. */
function applyStableEmittedIdMap(source: string, map: Map<string, string>): string {
  let out = source
  const replacements: Array<{ from: string; to: string }> = []
  for (const [hash, stable] of map) {
    replacements.push({ from: `./chunks/${hash}.js`, to: `./chunks/${stable}.js` })
    replacements.push({ from: hash, to: stable })
  }
  replacements.sort((a, b) => b.from.length - a.from.length)
  for (const { from, to } of replacements) {
    if (from !== to) {
      out = out.split(from).join(to)
    }
  }
  return out.replace(/_[0-9a-f]{16}/g, '_<id>')
}

function firstRepresentativeChunkBasename(manifestJs: string): string {
  const prefix = 'export const manifest = '
  const jsonStart = manifestJs.indexOf(prefix)
  if (jsonStart === -1) {
    throw new Error('expected manifest export')
  }
  const bodyStart = jsonStart + prefix.length
  const exportDefaultAt = manifestJs.indexOf('\nexport default', bodyStart)
  if (exportDefaultAt === -1) {
    throw new Error('expected manifest export terminator')
  }
  let jsonText = manifestJs.slice(bodyStart, exportDefaultAt).trimEnd()
  if (jsonText.endsWith(';')) {
    jsonText = jsonText.slice(0, -1).trimEnd()
  }
  const obj = JSON.parse(jsonText) as {
    symbolsById: Record<string, { name: string; chunk: string }>
  }
  const sorted = Object.entries(obj.symbolsById).sort((a, b) => {
    const na = a[1].name
    const nb = b[1].name
    return na.localeCompare(nb) || a[0].localeCompare(b[0])
  })
  if (sorted.length === 0) {
    throw new Error('expected at least one symbol in manifest')
  }
  return basename(sorted[0]![1].chunk)
}

export function caseOutputDir(caseName: string) {
  return join(packageDir, 'tests', 'tasty', 'cases', caseName, 'output')
}

function caseSnapshotDir(caseName: string) {
  return join(packageDir, 'tests', 'tasty', 'cases', caseName, '__snapshots__')
}

export function caseManifestPath(caseName: string) {
  return join(caseOutputDir(caseName), 'manifest.js')
}

/** Golden snapshots for `manifest.js` and the lexicographically first `chunks/*.js` file. */
export function addCaseEmittedSnapshotTests(caseName: string) {
  it('emitted manifest matches snapshot', async () => {
    const dir = caseOutputDir(caseName)
    const manifest = await readFile(join(dir, 'manifest.js'), 'utf-8')
    const idMap = buildStableEmittedIdMap(manifest)
    await expect(applyStableEmittedIdMap(manifest, idMap)).toMatchFileSnapshot(
      join(caseSnapshotDir(caseName), 'manifest.js.snap'),
    )
  })

  it('emitted representative chunk matches snapshot', async () => {
    const dir = caseOutputDir(caseName)
    const manifest = await readFile(join(dir, 'manifest.js'), 'utf-8')
    const idMap = buildStableEmittedIdMap(manifest)
    const chunksDir = join(dir, 'chunks')
    const chunkName = firstRepresentativeChunkBasename(manifest)
    const content = await readFile(join(chunksDir, chunkName), 'utf-8')
    await expect(applyStableEmittedIdMap(content, idMap)).toMatchFileSnapshot(
      join(caseSnapshotDir(caseName), 'representative-chunk.js.snap'),
    )
  })
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

/** Context for symbol-focused case tests: shared `TastyApi` and the smoke-test symbol name. */
export type CaseSymbolContext = {
  api: TastyApi
  symbolName: string
}

/**
 * Nests runtime smoke tests (`addCaseRuntimeSmokeTests`) and a pre-built `createCaseApi(caseName)`
 * under `describe(\`${caseName}/${symbolName}\`)` so output groups by case + primary symbol.
 * Keep {@link addCaseEmittedSnapshotTests} in the parent `describe` when present.
 */
export function describeCaseSymbol(
  caseName: string,
  symbolName: string,
  fn: (ctx: CaseSymbolContext) => void
): void {
  describe(`${caseName}/${symbolName}`, () => {
    addCaseRuntimeSmokeTests(caseName, symbolName)
    const api = createCaseApi(caseName)
    fn({ api, symbolName })
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

/**
 * Asserts the emit pipeline returned a symbol we can query and an underlying `TypeRef`.
 * Structured types use `kind`; unresolved references use `id` + `name` (no `kind`).
 */
export function expectUnderlyingPresent(symbol: TastySymbol): void {
  const underlying = symbol.getUnderlyingType()
  expect(underlying, `${symbol.getName()}: expected underlying type`).toBeDefined()
  const raw = underlying!.getRaw() as { kind?: string; name?: string; id?: string }
  const structured = raw.kind != null && raw.kind !== ''
  const reference = raw.name != null && raw.id != null
  expect(
    structured || reference,
    `${symbol.getName()}: expected structured type (\`kind\`) or reference (\`id\`+\`name\`)`,
  ).toBe(true)
}

/**
 * Asserts the underlying type is one of several allowed `kind` values (e.g. when multiple
 * representations are acceptable as the extractor evolves).
 */
export function expectUnderlyingKindOneOf(
  symbol: TastySymbol,
  kinds: readonly string[],
): void {
  const underlying = symbol.getUnderlyingType()
  expect(underlying, `${symbol.getName()}: expected underlying type`).toBeDefined()
  const raw = underlying!.getRaw() as { kind?: string }
  expect(kinds, `${symbol.getName()}: expected one of ${kinds.join(', ')}`).toContain(raw.kind)
}
