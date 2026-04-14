/** Buffer generated output writes until the sync session reaches a ready edge. */

import { toNormalizedPath } from './outputs'
import type { ManagedWriteBuffer } from './types'

export function createManagedWriteBuffer(): ManagedWriteBuffer {
  const pendingWrites = new Set<string>()

  return {
    remember(file: string): void {
      pendingWrites.add(toNormalizedPath(file))
    },

    flush(flushPendingWrites: (pendingFiles: Set<string>) => void): void {
      if (pendingWrites.size === 0) return

      const files = new Set(pendingWrites)
      pendingWrites.clear()
      flushPendingWrites(files)
    },

    clear(): void {
      pendingWrites.clear()
    },
  }
}