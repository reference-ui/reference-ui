/**
 * Atomic case helpers. Specs import this module only: compile a case input
 * tree and match wants on the result. Paths resolve under
 * tests/cases/<ATM-AREA-NN>. This module owns standing gauges and golden extractors.
 */
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect } from 'vitest'
import { compile } from '../js/index.js'
import type { BaseSystemInput, CompileRequest, CompileResult } from '../js/types.js'
import type { GoldenDefinition, StandingGauge } from '../../../testing/index.js'

export type { CompileResult, Want, BaseSystemInput, RecipeTable, RecipeMatch } from '../js/types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const CASES_DIR = path.resolve(__dirname, 'cases')
export const LAYER_PREAMBLE = '@layer reset, global, base, tokens, recipes, utilities;'
export const CASE_FOLDER = /^(ATM-[A-Z]+-\d{2})$/

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
    expect(result.stylesheet.startsWith(LAYER_PREAMBLE)).toBe(true)
    for (const className of Object.values(result.css.classes ?? {})) {
      expect(result.stylesheet).toContain(classSelector(className))
    }
  },
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
  const baseSystem = extras.baseSystem ?? readOptionalBaseSystem(rootDir)
  return compile({
    rootDir,
    ...extras,
    ...(baseSystem ? { baseSystem } : {}),
  })
}

function readOptionalBaseSystem(rootDir: string): BaseSystemInput | undefined {
  const dumpPath = path.join(rootDir, 'baseSystem.json')
  if (!fs.existsSync(dumpPath)) {
    return undefined
  }
  return JSON.parse(fs.readFileSync(dumpPath, 'utf8')) as BaseSystemInput
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

export function classSelector(className: string): string {
  return `.${className.replace(/[:/.!%#[\](),&=@>+~{}"']/g, '\\$&')}`
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
