/** Merge Reference UI's generated package ids into Vite's optimizeDeps.exclude. */

import { MANAGED_PACKAGES } from './constants'

export function withManagedPackageExcludes(userConfig: {
  optimizeDeps?: { exclude?: string[] }
}): { optimizeDeps: { exclude: string[] } } {
  const existingExcludes = userConfig.optimizeDeps?.exclude ?? []

  return {
    optimizeDeps: {
      exclude: Array.from(new Set([...existingExcludes, ...MANAGED_PACKAGES])),
    },
  }
}