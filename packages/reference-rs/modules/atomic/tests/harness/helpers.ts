/**
 * Atomic case helpers. Specs import this module only: compile a case input
 * tree and match wants on the result. Paths resolve under
 * tests/cases/<ATM-AREA-NN>. This module owns standing gauges and golden extractors.
 * Gauges enforce the package-wrapped six-layer preamble, CSS grammar (ATM-VALID-01 / ATM-VALID-02),
 * utilities-layer membership for every runtime class, idempotence, input-order
 * independence, and namer injectivity. Class selectors come from css-tree, never
 * from a TypeScript escaper. Cases listed in ISOLATED_CASES compile in a child process through
 * runIsolated, so a native abort or a hang is a named failure of that case.
 */
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'
import { compile } from '../../js/index.js'
import type { CompileRequest, CompileResult } from '../../js/types.js'
import type { EvaluatedSystemSpec } from '../../../../contracts/types.js'
import libSystemSpecJson from '../fixtures/lib-system-spec.json'
import { expectBounded, runIsolated } from '../../../../testing/isolated.js'
import type {
  GoldenDefinition,
  StandingGauge,
  StationContext,
} from '../../../../testing/index.js'
import {
  unexpectedCssProblems,
  validateCss,
  type CssProblem,
} from '../../../../testing/css.js'
import { quarantineFor } from './css-quarantine.js'
import { INJECTIVITY_QUARANTINE } from './injectivity-quarantine.js'
import { assertExemptionsFresh, isUnmatchable } from './unmatchable-classes.js'
import { expectPackageWrapped } from './package-layers.js'
import { layerClassNames } from './css-layers.js'
import { collectInputSources } from './input-sources.js'

export type {
  CompileResult,
  Want,
  RecipeTable,
  RecipeRuntimeTable,
  RecipeMatch,
} from '../../js/types.js'

export { getWantsForProp, harvestWants, hasWant, siteWants, wantBackings } from './wants.js'
export { layerBody, layerClassNames } from './css-layers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const CASES_DIR = path.resolve(__dirname, '..', 'cases')
export const CASE_FOLDER = /^(ATM-[A-Z]+-\d{2,3})$/
export { LAYER_PREAMBLE, LIB_PACKAGE_OPEN, ROOT_DEFAULT_BLOCK } from './package-layers.js'

/** Frozen lib spec for cases without their own baseSystem; the seam validates it. */
export const LIB_SYSTEM_SPEC = libSystemSpecJson as EvaluatedSystemSpec

export interface AtomicCaseSpec {
  id: string
  verify(result: CompileResult): void | Promise<void>
}

export const atomicGoldens: GoldenDefinition<CompileResult>[] = [
  {
    fileName: 'styles.css',
    format: 'text',
    extract: r => r.stylesheet || '',
  },
  {
    fileName: 'css.json',
    format: 'json',
    extract: r => r.css?.classes ?? {},
  },
  {
    fileName: 'diagnostics.json',
    format: 'json',
    extract: r => r.diagnostics ?? [],
  },
]

export const atomicGauges: StandingGauge<CompileResult>[] = [
  result => {
    expectPackageWrapped(result.stylesheet)
  },
  noGhostClasses,
  cssIsValid,
  artifactsAreIdempotent,
  artifactsIgnoreFileOrder,
  namerIsInjective,
]

export function parseCaseFolder(folderName: string): string | null {
  const match = CASE_FOLDER.exec(folderName)
  return match ? match[1]! : null
}

export function getCaseDir(caseName: string): string {
  return path.join(CASES_DIR, caseName)
}

export function getCaseInputDir(caseName: string): string {
  return path.join(getCaseDir(caseName), 'input')
}

export function getCaseOutputDir(caseName: string): string {
  return path.join(getCaseDir(caseName), 'output')
}

/**
 * Cases whose compile runs in a child process. A native abort or a hang then ends the case as a named
 * failure, and the compile must finish inside ISOLATED_BUDGET_MS, Node startup included.
 */
const ISOLATED_CASES: ReadonlySet<string> = new Set(['ATM-BOUND-01'])
const ISOLATED_BUDGET_MS = 5000
const ISOLATED_KILL_MS = 60_000

export async function compileCase(
  caseName: string,
  extras: Partial<CompileRequest> = {}
): Promise<CompileResult> {
  if (ISOLATED_CASES.has(caseName)) {
    return compileIsolated(caseName, extras)
  }
  const rootDir = path.resolve(getCaseInputDir(caseName))
  const baseSystem =
    extras.baseSystem ?? readOptionalBaseSystem(rootDir) ?? LIB_SYSTEM_SPEC
  // Cases read the compile-internal rows, so the harness always requests
  // the proof channel; an explicit extras.logs still wins for slim-path tests.
  return compile({ logs: ['proof'], rootDir, ...extras, baseSystem })
}

/** Compile one case in a child process; a signal, a hang or an over-budget run fails the case by name. */
function compileIsolated(caseName: string, extras: Partial<CompileRequest>): CompileResult {
  const run = runIsolated<CompileResult>({
    module: path.join(getCaseDir(caseName), 'driver.mjs'),
    fn: 'compileInput',
    args: [path.resolve(getCaseInputDir(caseName)), extras],
    timeoutMs: ISOLATED_KILL_MS,
  })
  return expectBounded(run, { ms: ISOLATED_BUDGET_MS })
}

function readOptionalBaseSystem(rootDir: string): EvaluatedSystemSpec | undefined {
  const specPath = path.join(rootDir, 'baseSystem.json')
  if (!fs.existsSync(specPath)) {
    return undefined
  }
  return JSON.parse(fs.readFileSync(specPath, 'utf8')) as EvaluatedSystemSpec
}

export function noGhostClasses(result: CompileResult, context: StationContext): void {
  const utilities = layerClassNames(result.stylesheet, 'utilities')
  const emitted = Object.values(result.css?.classes ?? {})
  const missing = emitted.filter(
    name => !utilities.has(name) && !isUnmatchable(context.caseId, name)
  )
  expect(
    missing,
    `ATM-GHOST-01 ${context.caseId}: runtime class(es) missing from @layer utilities: ${missing.join(', ')}`
  ).toEqual([])
  assertExemptionsFresh(emitted, utilities, context.caseId)
  const planClasses = (result.stylePlans ?? []).flatMap(plan =>
    plan.declarations.map(decl => decl.className)
  )
  const planMissing = planClasses.filter(
    name => !utilities.has(name) && !isUnmatchable(context.caseId, name)
  )
  expect(
    planMissing,
    `ATM-SEAM-01 ${context.caseId}: plan class(es) missing from @layer utilities: ${planMissing.join(', ')}`
  ).toEqual([])
}

function cssIsValid(result: CompileResult, context: StationContext): void {
  const problems = unexpectedCssProblems(
    validateCss(result.stylesheet),
    quarantineFor(context.caseId)
  )
  expect(problems, cssGaugeMessage(context.caseId, problems)).toEqual([])
}

async function artifactsAreIdempotent(
  result: CompileResult,
  context: StationContext
): Promise<void> {
  const again = await compileCase(context.caseName)
  expectEqualArtifacts(context.caseId, 'ATM-ORDER-05', result, again)
}

async function artifactsIgnoreFileOrder(
  result: CompileResult,
  context: StationContext
): Promise<void> {
  const files = collectInputSources(context.inputDir)
  const reversed = await compileCase(context.caseName, { files: files.slice().reverse() })
  expectEqualArtifacts(context.caseId, 'ATM-ORDER-06', result, reversed)
}

function namerIsInjective(result: CompileResult, context: StationContext): void {
  const names = Object.values(result.css.classes ?? {})
  const distinct = new Set(names).size
  const atoms = result.atomCount
  const owner = `ATM-GHOST-04 ${context.caseId}`
  expect(typeof atoms, `${owner}: CompileResult.atomCount is required`).toBe('number')
  if (INJECTIVITY_QUARANTINE.includes(context.caseId)) {
    expect(
      distinct,
      `${owner}: namer is injective; remove from INJECTIVITY_QUARANTINE`
    ).not.toBe(atoms)
    return
  }
  // Foreign partition (G0 §J/D6): wants another system renders resolve but stay
  // out of the own css map, while `atomCount` counts own + foreign. The strict
  // coverage identity holds only when no such want is present; otherwise every
  // emitted (own) class name must still be distinct.
  const hasExternal = (result.wants ?? []).some(want => want.backing !== undefined)
  if (hasExternal) {
    expect(
      distinct,
      `${owner}: emitted class names collide (${distinct} distinct of ${names.length})`
    ).toBe(names.length)
    return
  }
  expect(distinct, `${owner}: ${atoms} atoms but ${distinct} class names`).toBe(atoms)
}

function expectEqualArtifacts(
  caseId: string,
  owner: string,
  left: CompileResult,
  right: CompileResult
): void {
  expect(right.stylesheet, `${owner} ${caseId}: stylesheet`).toBe(left.stylesheet)
  expect(right.css.classes, `${owner} ${caseId}: css.classes`).toEqual(left.css.classes)
  expect(right.diagnostics, `${owner} ${caseId}: diagnostics`).toEqual(left.diagnostics)
}

function cssGaugeMessage(stationId: string, problems: CssProblem[]): string {
  return problems
    .map(problem => {
      const owner = problem.kind === 'syntax' ? 'ATM-VALID-01' : 'ATM-VALID-02'
      return `${owner} ${stationId}: ${problem.message}`
    })
    .join('\n')
}
