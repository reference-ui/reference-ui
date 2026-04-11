/** Watch generated output roots and report writes that should be buffered by bundlers. */

import { subscribe } from '@parcel/watcher'
import { isManagedOutputFile } from './outputs'
import type { ManagedOutputSubscription, ReferenceProjectPaths } from './types'

export async function subscribeToManagedOutputWrites(
  projectPaths: ReferenceProjectPaths,
  onWrite: (file: string) => void
): Promise<ManagedOutputSubscription> {
  return subscribe(projectPaths.outDir, (error, events) => {
    if (error) return

    for (const event of events) {
      if (!isManagedOutputFile(event.path, projectPaths.managedOutputRoots)) continue
      onWrite(event.path)
    }
  })
}