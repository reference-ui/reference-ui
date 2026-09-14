/**
 * Test utilities and fixture loaders for Reference UI system compiler integration testing.
 * Provides virtual file compilation helpers, assertion matchers, and path resolvers for case fixtures.
 * Streamlines seam testing by verifying AST extraction and stylesheet emission without disk overhead.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile, compileSync } from '../../js/system/index.js'
import type {
  CompileRequest,
  CompileResult,
  VirtualSource,
} from '../../js/system/types.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const TESTS_SYSTEM_DIR = __dirname
export const CASES_DIR = path.resolve(TESTS_SYSTEM_DIR, 'cases')
export const SEED_CONTRACT_DIR = path.join(CASES_DIR, 'seed_contract')

export function getCaseDir(caseName: string): string {
  return path.join(CASES_DIR, caseName)
}

export function getCaseInputDir(caseName: string): string {
  return path.join(getCaseDir(caseName), 'input', 'app')
}

/**
 * Compile virtual files provided as array or record map.
 */
export async function compileVirtual(
  files: VirtualSource[] | Record<string, string>
): Promise<CompileResult> {
  const normalizedFiles: VirtualSource[] = Array.isArray(files)
    ? files
    : Object.entries(files).map(([pathKey, content]) => ({
        path: pathKey,
        content,
      }))

  return compile({ files: normalizedFiles })
}

/**
 * Compile a fixture directory.
 */
export async function compileFixture(
  fixtureDir: string
): Promise<CompileResult> {
  const normalizedRoot = path.resolve(fixtureDir)
  return compile({ rootDir: normalizedRoot })
}

/**
 * Synchronously compile virtual files.
 */
export function compileVirtualSync(
  files: VirtualSource[] | Record<string, string>
): CompileResult {
  const normalizedFiles: VirtualSource[] = Array.isArray(files)
    ? files
    : Object.entries(files).map(([pathKey, content]) => ({
        path: pathKey,
        content,
      }))

  return compileSync({ files: normalizedFiles })
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

function matchesConditions(actual: string[], expected: string[]): boolean {
  if (actual.length !== expected.length) return false
  return actual.every((cond, idx) => cond === expected[idx])
}

/**
 * Check if a compile result contains a specific want.
 */
export function hasWant(
  result: CompileResult,
  prop: string,
  value: string | number | boolean,
  when: string[] = []
): boolean {
  return (result.wants ?? []).some(
    (w) => w.prop === prop && matchesWantValue(w.value, value) && matchesConditions(w.when, when)
  )
}

/**
 * Filter wants for a given property.
 */
export function getWantsForProp(result: CompileResult, prop: string): NonNullable<CompileResult['wants']> {
  return (result.wants ?? []).filter((w) => w.prop === prop)
}

