/**
 * JavaScript interface for the Styletrace JSX wrapper and prop resolution system.
 * Accepts source project paths and optional synchronization root directory hints.
 * Coordinates with the native Rust engine to trace wrapper hierarchies and exposed style props.
 * Emits component and wrapper identifiers recognized by the style system compiler.
 */
import path from 'node:path'

import { analyzeStyletrace } from './runtime'

export async function trace(rootDir: string, syncRootHint?: string): Promise<string[]> {
  const normalizedRoot = path.resolve(rootDir)
  const normalizedSyncRootHint = syncRootHint ? path.resolve(syncRootHint) : undefined

  return analyzeStyletrace(normalizedRoot, normalizedSyncRootHint)
}
