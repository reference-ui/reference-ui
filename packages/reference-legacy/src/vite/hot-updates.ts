/** Build one native Vite hot-update payload from a batch of generated file writes. */

import type { ModuleNode, ViteDevServer } from 'vite'
import type { ReferenceViteUpdate, ReferenceViteUpdatePayload } from './types'

export function buildHotUpdatePayload(
  server: ViteDevServer,
  pendingFiles: Set<string>
): ReferenceViteUpdatePayload | null {
  if (pendingFiles.size === 0) {
    return null
  }

  const updates = collectDistinctHotUpdates(server, pendingFiles)
  if (updates.length === 0) {
    return null
  }

  return {
    type: 'update',
    updates,
  }
}

function collectDistinctHotUpdates(
  server: ViteDevServer,
  pendingFiles: Set<string>
): ReferenceViteUpdate[] {
  const timestamp = Date.now()
  const updates: ReferenceViteUpdate[] = []
  const seenUpdateKeys = new Set<string>()

  for (const file of pendingFiles) {
    const touchedModules = server.moduleGraph.getModulesByFile(file)
    if (!touchedModules) continue

    for (const module of touchedModules) {
      server.moduleGraph.invalidateModule(module, new Set<ModuleNode>(), timestamp, true)

      const update = toHotUpdate(module, timestamp)
      if (!update) continue

      const updateKey = `${update.type}:${update.path}:${update.acceptedPath}`
      if (seenUpdateKeys.has(updateKey)) continue
      seenUpdateKeys.add(updateKey)
      updates.push(update)
    }
  }

  return updates
}

function toHotUpdate(
  module: ModuleNode,
  timestamp: number
): ReferenceViteUpdate | null {
  if (!module.url) {
    return null
  }

  return {
    type: module.type === 'css' ? 'css-update' : 'js-update',
    path: module.url,
    acceptedPath: module.url,
    timestamp,
  }
}