/**
 * Atlas test harness helpers and standing fixtures.
 * Provides on-demand case compilation, golden artifact extraction, standing schema gauges,
 * and component lookup utilities for case specifications and unit tests.
 * A case that carries input/observe.json also analyzes with that observe config.
 * Standardizes output verification across all Atlas test scenarios.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'
import { analyze, analyzeDetailed } from '../../js/index.js'
import type {
  AtlasConfig,
  AtlasDiagnostic,
  Component,
  ObservedElement,
  ObserveSpec,
  Usage,
} from '../../js/types.js'
import type {
  GoldenDefinition,
  StandingGauge,
  StationContext,
  StationSpec,
} from '../../../../testing/index.js'

const HARNESS_DIR = fileURLToPath(new URL('.', import.meta.url))
const TESTS_DIR = path.resolve(HARNESS_DIR, '..')

export const CASES_DIR = path.resolve(TESTS_DIR, 'cases')
export const CASE_FOLDER = /^(ATL-[A-Z]+-\d{2})$/
export const DEMO_SURFACE_CASE = 'ATL-SURF-01'
export const FIXTURE = path.join(CASES_DIR, DEMO_SURFACE_CASE, 'input', 'app')

export const USAGE_VALUES: Usage[] = [
  'very common',
  'common',
  'occasional',
  'rare',
  'unused',
]

const VALID_DIAGNOSTIC_CODES = [
  'ATL-W-UNRESOLVED-PROPS-TYPE',
  'ATL-W-UNSUPPORTED-PROPS-ANNOTATION',
  'ATL-W-UNRESOLVED-INCLUDE-PACKAGE',
  'ATL-E-SCAN-FAILED',
]

export interface AtlasDiagnosticsPayload {
  caseName: string
  diagnostics: AtlasDiagnostic[]
  notes: string[]
}

export interface AtlasAnalysisPayload {
  caseName: string
  analyses: {
    default: Component[]
    withIncludes: Record<string, Component[]>
    observed?: ObservedElement[]
  }
}

export interface AtlasCaseResult {
  caseName: string
  components: Component[]
  observed: ObservedElement[]
  diagnostics: AtlasDiagnostic[]
  withIncludes: Record<string, Component[]>
  analysisPayload: AtlasAnalysisPayload
  diagnosticsPayload: AtlasDiagnosticsPayload
}

export type AtlasCaseSpec = StationSpec<AtlasCaseResult>

export function usageRank(u: Usage): number {
  return USAGE_VALUES.indexOf(u)
}

export function getCaseDir(caseName: string): string {
  return path.join(CASES_DIR, caseName)
}

export function getCaseInputDir(caseName: string): string {
  return path.join(getCaseDir(caseName), 'input', 'app')
}

function discoverCasePackages(inputDir: string): string[] {
  if (!fs.existsSync(inputDir)) return []
  return fs
    .readdirSync(inputDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name !== 'app')
    .map(entry => path.join(inputDir, entry.name, 'package.json'))
    .filter(pkgJsonPath => fs.existsSync(pkgJsonPath))
    .map(pkgJsonPath => {
      try {
        return JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')) as { name?: string }
      } catch {
        return {}
      }
    })
    .map(pkg => pkg.name)
    .filter((name): name is string => Boolean(name))
}

/** The observe specs a case declares in input/observe.json; none when the file is absent. */
function readCaseObserve(inputDir: string): ObserveSpec[] {
  const file = path.join(inputDir, 'observe.json')
  if (!fs.existsSync(file)) return []
  return JSON.parse(fs.readFileSync(file, 'utf8')) as ObserveSpec[]
}

export async function compileAtlasCase(ctx: StationContext): Promise<AtlasCaseResult> {
  const appRoot = path.join(ctx.inputDir, 'app')
  const includePackages = discoverCasePackages(ctx.inputDir)
  const observe = readCaseObserve(ctx.inputDir)

  const config: AtlasConfig | undefined =
    observe.length > 0 ? { rootDir: appRoot, observe } : undefined
  const detailed = await analyzeDetailed(appRoot, config)
  const observed = detailed.observed ?? []
  const withIncludes: Record<string, Component[]> = {}
  for (const packageName of includePackages) {
    withIncludes[packageName] = await analyze(appRoot, { include: [packageName] })
  }

  const analysisPayload: AtlasAnalysisPayload = {
    caseName: ctx.caseName,
    analyses: {
      default: detailed.components,
      withIncludes,
      ...(observed.length > 0 ? { observed } : {}),
    },
  }

  const diagnosticsPayload: AtlasDiagnosticsPayload = {
    caseName: ctx.caseName,
    diagnostics: detailed.diagnostics,
    notes: [
      'Atlas currently emits usage and interface mapping only.',
      'Rich prop/member metadata is expected to be resolved by Tasty in an upper layer.',
      'Use analyzeDetailed() when callers need both partial results and diagnostics.',
    ],
  }

  return {
    caseName: ctx.caseName,
    components: detailed.components,
    observed,
    diagnostics: detailed.diagnostics,
    withIncludes,
    analysisPayload,
    diagnosticsPayload,
  }
}

export const atlasGoldens: GoldenDefinition<AtlasCaseResult>[] = [
  {
    fileName: 'analysis.json',
    format: 'json',
    extract: (res: AtlasCaseResult) => res.analysisPayload,
  },
  {
    fileName: 'diagnostics.json',
    format: 'json',
    extract: (res: AtlasCaseResult) => res.diagnosticsPayload,
  },
]

export const atlasGauges: StandingGauge<AtlasCaseResult>[] = [
  // ATL-SCHEMA-01: Component schema integrity
  (res: AtlasCaseResult) => {
    for (const comp of res.components) {
      expect(comp.name).toBeTruthy()
      expect(comp.source).toBeTruthy()
      expect(USAGE_VALUES).toContain(comp.usage)
      expect(comp.count).toBeGreaterThanOrEqual(0)
      for (const prop of comp.props) {
        expect(prop.name).toBeTruthy()
        expect(prop.count).toBeGreaterThanOrEqual(0)
        expect(USAGE_VALUES).toContain(prop.usage)
      }
    }
  },
  // ATL-SCHEMA-02: Observed element schema integrity
  (res: AtlasCaseResult) => {
    for (const element of res.observed) {
      expect(element.name).toBeTruthy()
      expect(element.source).toBeTruthy()
      expect(USAGE_VALUES).toContain(element.usage)
      expect(element.count).toBeGreaterThan(0)
      expect(element.filePresence).toBeGreaterThan(0)
      expect(element.filePresence).toBeLessThanOrEqual(element.count)
      expect(element.examples.length).toBeLessThanOrEqual(5)
      for (const prop of element.props) {
        expect(prop.name).toBeTruthy()
        expect(prop.count).toBeGreaterThan(0)
        expect(prop.count).toBeLessThanOrEqual(element.count)
        expect(USAGE_VALUES).toContain(prop.usage)
      }
    }
  },
  // ATL-DIAG-01: Diagnostic schema integrity
  (res: AtlasCaseResult) => {
    for (const diag of res.diagnostics) {
      expect(['warning', 'error']).toContain(diag.severity)
      expect(VALID_DIAGNOSTIC_CODES).toContain(diag.code)
      expect(diag.message.trim().length).toBeGreaterThan(0)
      if (diag.file !== undefined) {
        expect(diag.file).toBeTruthy()
      }
    }
  },
]

function matchesComponent(comp: Component, name: string, source?: string): boolean {
  if (comp.name !== name) return false
  return source === undefined || comp.source === source
}

export function findCaseComponent(
  result: AtlasCaseResult,
  name: string,
  source?: string
): Component | undefined {
  if (source && result.withIncludes[source]) {
    const fromInc = result.withIncludes[source].find(c => c.name === name)
    if (fromInc) return fromInc
  }
  const fromDirect = result.components.find(c => matchesComponent(c, name, source))
  if (fromDirect) return fromDirect

  for (const comps of Object.values(result.withIncludes)) {
    const found = comps.find(c => matchesComponent(c, name, source))
    if (found) return found
  }
  return undefined
}

export function getCaseComponent(
  result: AtlasCaseResult,
  name: string,
  source?: string
): Component {
  const c = findCaseComponent(result, name, source)
  if (!c) {
    throw new Error(`Component "${name}" not found in case results`)
  }
  return c
}

const cache = new Map<string, Promise<Component[]>>()

export function getComponents(
  config?: AtlasConfig,
  caseName = DEMO_SURFACE_CASE
): Promise<Component[]> {
  const key = JSON.stringify({ caseName, config: config ?? null })
  if (!cache.has(key)) {
    cache.set(key, analyze(getCaseInputDir(caseName), config))
  }
  return cache.get(key)!
}

export async function getComponent(
  name: string,
  config?: AtlasConfig,
  source?: string,
  caseName = DEMO_SURFACE_CASE
): Promise<Component> {
  const components = await getComponents(config, caseName)
  const c = components.find(
    x => x.name === name && (source === undefined || x.source === source)
  )
  if (!c) {
    const qualifier = source ? ` from "${source}"` : ''
    throw new Error(
      `Component "${name}"${qualifier} not found in analysis results.\n` +
        `Available: ${components.map(x => `${x.name}(${x.source})`).join(', ')}`
    )
  }
  return c
}
