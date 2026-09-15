/**
 * Tasty station test harness helpers and execution pipeline.
 * Provides on-demand compilation, module and type declaration emission,
 * standing invariant gauges, and committed golden management for TST-* stations.
 * Enables fast isolated station testing without eager global pre-runners.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'
import {
  createTastyApi,
  type CreateTastyApiOptions,
  type TastyApi,
  type TastyMember,
  type TastySymbol,
} from '../js/index.js'
import { scanAndEmitModules, type EmittedModulesPayload } from '../js/runtime.js'
import type {
  GoldenDefinition,
  StandingGauge,
  StationContext,
  StationSpec,
} from '../../../testing/index.js'

export type {
  CreateTastyApiOptions,
  TastyApi,
  TastyMember,
  TastySymbol,
  StationSpec,
  StationContext,
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const TESTS_DIR = __dirname
export const CASES_DIR = path.resolve(__dirname, 'cases')
export const SCRATCH_DIR = path.resolve(__dirname, '.scratch')
export const CASE_FOLDER = /^(TST-[A-Z]+-\d{2})-.+$/

export const TEST_PREFERRED_EXTERNAL_LIBRARIES = [
  '@reference-ui/react',
  '@reference-ui/system',
  '@reference-ui/types',
]

export const TEST_SYSTEM_PROPERTIES_LIBRARIES = [
  '@reference-ui/styled',
  '@reference-ui/react',
  '@reference-ui/system',
  '@reference-ui/types',
]

export interface TastyCaseResult {
  api: TastyApi
  emitted: EmittedModulesPayload
  /** Scratch dir the API loads from. Not the committed golden directory. */
  runtimeDir: string
}

export type TastyCaseSpec = StationSpec<TastyCaseResult>

export async function projectTestTypeParameterMembers(
  api: TastyApi,
  name: string
): Promise<TastyMember[] | undefined> {
  if (name !== 'P') return undefined

  for (const library of TEST_SYSTEM_PROPERTIES_LIBRARIES) {
    try {
      const projectedSymbol = await api.findSymbolByScopedName(
        library,
        'SystemProperties'
      )
      if (projectedSymbol) {
        return projectedSymbol.getDisplayMembers()
      }
    } catch {
      // Keep trying narrower library scopes before falling back to a bare lookup.
    }
  }

  try {
    const projectedSymbol = await api.loadSymbolByName('SystemProperties')
    return projectedSymbol.getDisplayMembers()
  } catch {
    return undefined
  }
}

function writeArtifactsToDisk(outputDir: string, files: Record<string, string>): void {
  fs.mkdirSync(outputDir, { recursive: true })
  for (const [relPath, content] of Object.entries(files)) {
    const cleanRel = relPath.replace(/^\.\//, '')
    const targetPath = path.join(outputDir, cleanRel)
    fs.mkdirSync(path.dirname(targetPath), { recursive: true })
    const normalizedContent = content.endsWith('\n') ? content : `${content}\n`
    fs.writeFileSync(targetPath, normalizedContent, 'utf-8')
  }
}

async function executeTastyCompilation(ctx: StationContext): Promise<TastyCaseResult> {
  const include = [`cases/${ctx.caseName}/input/**/*.{ts,tsx}`]
  const raw = scanAndEmitModules(TESTS_DIR, include)
  const emitted: EmittedModulesPayload = {
    modules: raw.modules ?? {},
    type_declarations: raw.type_declarations ?? {},
    diagnostics: raw.diagnostics ?? [],
  }

  const allFiles = {
    ...emitted.modules,
    ...emitted.type_declarations,
  }
  const runtimeDir = caseRuntimeDir(ctx.caseName)
  writeArtifactsToDisk(runtimeDir, allFiles)

  const api = createTastyApi({
    manifestPath: path.join(runtimeDir, 'manifest.js'),
    preferredExternalLibraries: TEST_PREFERRED_EXTERNAL_LIBRARIES,
    projectTypeParameterMembers: ({ api: a, reference }) =>
      projectTestTypeParameterMembers(a, reference.name),
  })
  await api.ready()

  return {
    api,
    emitted,
    runtimeDir,
  }
}

const compilationCache = new Map<string, Promise<TastyCaseResult>>()

export async function compileTastyCase(ctx: StationContext): Promise<TastyCaseResult> {
  const existing = compilationCache.get(ctx.caseName)
  if (existing) {
    return existing
  }

  const task = executeTastyCompilation(ctx)
  compilationCache.set(ctx.caseName, task)
  return task
}

export async function ensureTastyCaseCompiled(
  caseName: string
): Promise<TastyCaseResult> {
  const caseDir = path.join(CASES_DIR, caseName)
  const match = CASE_FOLDER.exec(caseName)
  const caseId = match ? match[1]! : caseName
  return compileTastyCase({
    caseName,
    caseId,
    caseDir,
    inputDir: path.join(caseDir, 'input'),
    outputDir: path.join(caseDir, 'output'),
  })
}

export function caseOutputDir(caseName: string): string {
  return path.join(CASES_DIR, caseName, 'output')
}

export function caseRuntimeDir(caseName: string): string {
  return path.join(SCRATCH_DIR, caseName)
}

export function caseManifestPath(caseName: string): string {
  return path.join(caseRuntimeDir(caseName), 'manifest.js')
}

export function createCaseApi(
  caseName: string,
  overrides: Partial<CreateTastyApiOptions> = {}
): TastyApi {
  return createTastyApi({
    manifestPath: caseManifestPath(caseName),
    preferredExternalLibraries:
      overrides.preferredExternalLibraries ?? TEST_PREFERRED_EXTERNAL_LIBRARIES,
    projectTypeParameterMembers:
      overrides.projectTypeParameterMembers ??
      (({ api, reference }) => projectTestTypeParameterMembers(api, reference.name)),
    ...overrides,
  })
}

export const tastyGoldens: GoldenDefinition<TastyCaseResult>[] = [
  {
    fileName: 'manifest.js',
    format: 'text',
    extract: r => r.emitted.modules['./manifest.js'] ?? '',
  },
  {
    fileName: 'chunks.json',
    format: 'json',
    extract: r => ({
      modules: Object.keys(r.emitted.modules).sort(),
      declarations: Object.keys(r.emitted.type_declarations ?? {}).sort(),
    }),
  },
]

export const tastyGauges: StandingGauge<TastyCaseResult>[] = [
  async result => {
    const manifest = await result.api.loadManifest()
    expect(manifest.version).toBe('2')
    expect(typeof manifest.symbolsByName).toBe('object')
    expect(typeof manifest.symbolsById).toBe('object')
    expect(result.emitted.modules['./manifest.js']).toBeDefined()

    const symbolIds = Object.keys(manifest.symbolsById)
    if (symbolIds.length > 0) {
      const sampleId = symbolIds[0]!
      const sampleSymbol = await result.api.loadSymbolById(sampleId)
      const byId = await result.api.loadSymbolById(sampleSymbol.getId())
      expect(byId).toBe(sampleSymbol)
    }

    const uniqueName = Object.keys(manifest.symbolsByName).find(
      name => manifest.symbolsByName[name]?.length === 1
    )
    if (uniqueName) {
      const byName = await result.api.loadSymbolByName(uniqueName)
      expect(byName.getName()).toBe(uniqueName)
    }
  },
]

export function findMember(symbol: TastySymbol, memberName: string): TastyMember {
  const member = symbol.getMembers().find(item => item.getName() === memberName)
  if (!member) {
    throw new Error(`Member not found on ${symbol.getName()}: ${memberName}`)
  }
  return member
}

export function expectUnderlyingPresent(symbol: TastySymbol): void {
  const underlying = symbol.getUnderlyingType()
  expect(underlying, `${symbol.getName()}: expected underlying type`).toBeDefined()
  const raw = underlying!.getRaw() as { kind?: string; name?: string; id?: string }
  const structured = raw.kind != null && raw.kind !== ''
  const reference = raw.name != null && raw.id != null
  expect(
    structured || reference,
    `${symbol.getName()}: expected structured type (\`kind\`) or reference (\`id\`+\`name\`)`
  ).toBe(true)
}

export function expectUnderlyingKindOneOf(
  symbol: TastySymbol,
  kinds: readonly string[]
): void {
  const underlying = symbol.getUnderlyingType()
  expect(underlying, `${symbol.getName()}: expected underlying type`).toBeDefined()
  const raw = underlying!.getRaw() as { kind?: string }
  expect(kinds, `${symbol.getName()}: expected one of ${kinds.join(', ')}`).toContain(
    raw.kind
  )
}
