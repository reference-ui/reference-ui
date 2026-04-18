import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { trace } from '../../js/styletrace'

const TESTS_STYLETRACE_DIR = fileURLToPath(new URL('.', import.meta.url))
const REFERENCE_RS_DIR = path.resolve(TESTS_STYLETRACE_DIR, '..', '..')

export function getCaseInputDir(caseName: string): string {
  return path.join(TESTS_STYLETRACE_DIR, 'cases', caseName, 'input')
}

export async function traceCase(caseName: string): Promise<string[]> {
  return trace(getCaseInputDir(caseName))
}

export function getWorkspaceFixtureDir(relativePath: string): string {
  return path.join(REFERENCE_RS_DIR, '..', '..', relativePath)
}

export async function traceFixtureDir(relativePath: string): Promise<string[]> {
  return trace(getWorkspaceFixtureDir(relativePath))
}