import path from 'node:path'

import { analyzeStyletrace } from '../runtime'

export async function trace(rootDir: string, syncRootHint?: string): Promise<string[]> {
  const normalizedRoot = path.resolve(rootDir)
  const normalizedSyncRootHint = syncRootHint ? path.resolve(syncRootHint) : undefined
  return JSON.parse(analyzeStyletrace(normalizedRoot, normalizedSyncRootHint)) as string[]
}