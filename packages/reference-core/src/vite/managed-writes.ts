/** Buffer generated output writes until the sync session reaches a ready edge. */

import { buildHotUpdatePayload } from './hot-updates'
import { toNormalizedPath } from './outputs'
import type { ReferenceViteDevServer } from './types'

export function createManagedWriteBuffer() {
  const pendingWrites = new Set<string>()

  return {
    remember(file: string): void {
      pendingWrites.add(toNormalizedPath(file))
    },

    flush(server: ReferenceViteDevServer): void {
      if (pendingWrites.size === 0) return

      const payload = buildHotUpdatePayload(server, pendingWrites)
      pendingWrites.clear()

      if (!payload) return
      server.ws.send(payload)
    },

    clear(): void {
      pendingWrites.clear()
    },
  }
}