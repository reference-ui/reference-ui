import path from 'node:path'

import { analyzeStyletrace } from '../runtime'

export async function trace(rootDir: string, workspaceHint?: string): Promise<string[]> {
  const normalizedRoot = path.resolve(rootDir)
  const normalizedWorkspaceHint = workspaceHint ? path.resolve(workspaceHint) : undefined
  return JSON.parse(analyzeStyletrace(normalizedRoot, normalizedWorkspaceHint)) as string[]
}