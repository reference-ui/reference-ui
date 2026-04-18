import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { trace } from '../../js/styletrace'

const TESTS_STYLETRACE_DIR = fileURLToPath(new URL('.', import.meta.url))

export function getCaseInputDir(caseName: string): string {
  return path.join(TESTS_STYLETRACE_DIR, 'cases', caseName, 'input')
}

export async function traceCase(caseName: string): Promise<string[]> {
  return trace(getCaseInputDir(caseName))
}