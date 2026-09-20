/**
 * Atomic case helpers. Specs import this module only: compile a case input
 * tree and match wants on the result. Paths resolve under
 * tests/cases/<ATM-AREA-NN>. This module owns standing gauges and golden extractors.
 * Gauges enforce the package-wrapped six-layer preamble, CSS grammar (ATM-VALID-01 / ATM-VALID-02),
 * utilities-layer membership for every runtime class, idempotence, input-order
 * independence, and namer injectivity. Class selectors come from css-tree, never
 * from a TypeScript escaper.
 */
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'
import * as csstree from 'css-tree'
import { compile } from '../js/index.js'
import type { CompileRequest, CompileResult, VirtualSource } from '../js/types.js'
import type { EvaluatedSystemSpec } from '../../../contracts/types.js'
import libSystemSpecJson from './fixtures/lib-system-spec.json'
import type {
  GoldenDefinition,
  StandingGauge,
  StationContext,
} from '../../../testing/index.js'
import {
  unexpectedCssProblems,
  validateCss,
  type CssProblem,
} from '../../../testing/css.js'
import { quarantineFor } from './css-quarantine.js'
import { INJECTIVITY_QUARANTINE } from './injectivity-quarantine.js'
import { assertExemptionsFresh, isUnmatchable } from './unmatchable-classes.js'
import { expectPackageWrapped } from './package-layers.js'

export type {
  CompileResult,
  Want,
  RecipeTable,
  RecipeRuntimeTable,
  RecipeMatch,
} from '../js/types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const CASES_DIR = path.resolve(__dirname, 'cases')
export const CASE_FOLDER = /^(ATM-[A-Z]+-\d{2})$/
export { LAYER_PREAMBLE, LIB_PACKAGE_OPEN } from './package-layers.js'

/** Frozen lib spec for stations without their own baseSystem; the seam validates it. */
export const LIB_SYSTEM_SPEC = libSystemSpecJson as EvaluatedSystemSpec

const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx'])
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.turbo',
  'target',
  '.reference-ui',
  '.reference',
  '.pipeline',
])

const decodeIdent = (
  csstree as typeof csstree & { ident: { decode: (value: string) => string } }
).ident.decode

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

export async function compileCase(
  caseName: string,
  extras: Partial<CompileRequest> = {}
): Promise<CompileResult> {
  const rootDir = path.resolve(getCaseInputDir(caseName))
  const baseSystem =
    extras.baseSystem ?? readOptionalBaseSystem(rootDir) ?? LIB_SYSTEM_SPEC
  return compile({ rootDir, ...extras, baseSystem })
}

function readOptionalBaseSystem(rootDir: string): EvaluatedSystemSpec | undefined {
  const specPath = path.join(rootDir, 'baseSystem.json')
  if (!fs.existsSync(specPath)) {
    return undefined
  }
  return JSON.parse(fs.readFileSync(specPath, 'utf8')) as EvaluatedSystemSpec
}

/** Decoded class names that appear as class selectors inside `@layer name`. */
export function layerClassNames(sheet: string, layer: string): Set<string> {
  const names = new Set<string>()
  const ast = parseStylesheet(sheet)
  if (!ast) {
    return names
  }
  csstree.walk(ast, {
    visit: 'Atrule',
    enter(node) {
      if (!isNamedLayer(node, layer) || !node.block) {
        return
      }
      collectClassNames(node.block, names)
    },
  })
  return names
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

function matchesWantValue(actual: unknown, expected: string | number | boolean): boolean {
  if (typeof expected === 'string') {
    return (actual as Record<string, string>)?.String === expected
  }
  if (typeof expected === 'number') {
    return (actual as Record<string, string>)?.Number === String(expected)
  }
  if (typeof expected === 'boolean') {
    return (actual as Record<string, boolean>)?.Bool === expected
  }
  return false
}

export function hasWant(
  result: CompileResult,
  prop: string,
  value: string | number | boolean,
  when: string[] = []
): boolean {
  return (result.wants ?? []).some(
    w =>
      w.prop === prop &&
      matchesWantValue(w.value, value) &&
      w.when.length === when.length &&
      w.when.every((cond, idx) => cond === when[idx])
  )
}

export function getWantsForProp(
  result: CompileResult,
  prop: string
): NonNullable<CompileResult['wants']> {
  return (result.wants ?? []).filter(w => w.prop === prop)
}

/** Wants minted by the site walk, excluding the harvest floor (`ATM-HARVEST-01`). */
export function siteWants(
  result: CompileResult
): NonNullable<CompileResult['wants']> {
  return (result.wants ?? []).filter(w => w.origin !== 'harvest')
}

/** Wants minted by harvest onto refused dynamic sinks (`ATM-HARVEST-01`). */
export function harvestWants(
  result: CompileResult
): NonNullable<CompileResult['wants']> {
  return (result.wants ?? []).filter(w => w.origin === 'harvest')
}

/** Inner text of `@layer name { ... }`, or empty if that layer was omitted. */
export function layerBody(sheet: string, name: string): string {
  const open = `@layer ${name} {`
  const start = sheet.indexOf(open)
  if (start < 0) {
    return ''
  }
  let depth = 0
  const from = start + open.length
  for (let i = from; i < sheet.length; i++) {
    const ch = sheet[i]
    if (ch === '{') {
      depth++
    } else if (ch === '}') {
      if (depth === 0) {
        return sheet.slice(from, i)
      }
      depth--
    }
  }
  return sheet.slice(from)
}

function parseStylesheet(sheet: string): csstree.CssNode | null {
  try {
    return csstree.parse(sheet, {
      positions: true,
      onParseError() {},
    })
  } catch {
    return null
  }
}

function isNamedLayer(node: csstree.CssNode, layer: string): node is csstree.Atrule {
  if (node.type !== 'Atrule' || node.name !== 'layer') {
    return false
  }
  const prelude = node.prelude ? csstree.generate(node.prelude).trim() : ''
  return prelude === layer
}

function collectClassNames(block: csstree.CssNode, names: Set<string>): void {
  csstree.walk(block, {
    enter(node) {
      if (node.type === 'ClassSelector') {
        names.add(decodeIdent(node.name))
        return
      }
      if (node.type === 'Rule' && node.prelude?.type === 'Raw') {
        addRawClassName(node.prelude.value, names)
      }
    },
  })
}

function addRawClassName(raw: string, names: Set<string>): void {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('.')) {
    return
  }
  names.add(decodeIdent(trimmed.slice(1)))
}

function collectInputSources(rootDir: string): VirtualSource[] {
  const files: VirtualSource[] = []
  walkInputDir(rootDir, files)
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
  return files
}

function walkInputDir(dir: string, files: VirtualSource[]): void {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  for (const entry of entries) {
    pushInputEntry(path.join(dir, entry.name), entry, files)
  }
}

function pushInputEntry(full: string, entry: fs.Dirent, files: VirtualSource[]): void {
  if (entry.isDirectory()) {
    if (!SKIP_DIRS.has(entry.name)) {
      walkInputDir(full, files)
    }
    return
  }
  if (SOURCE_EXT.has(path.extname(entry.name))) {
    files.push({ path: full, content: fs.readFileSync(full, 'utf8') })
  }
}
