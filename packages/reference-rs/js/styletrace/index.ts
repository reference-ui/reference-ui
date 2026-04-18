import path from 'node:path'

import { analyzeStyletrace } from '../runtime'

export async function trace(rootDir: string): Promise<string[]> {
  const normalizedRoot = path.resolve(rootDir)
  return JSON.parse(analyzeStyletrace(normalizedRoot)) as string[]
}