/**
 * Child-side driver for TST-BOUND-03, called by runIsolated in its own Node process. It builds the project the parent
 * wrote (rootDir) into outputDir through the built tasty build entry, then reads the manifest back and resolves to
 * the build's diagnostics and the sorted names of the symbols it emitted, as plain JSON for the parent to check.
 * It imports only the built dist, so a build that never returns ends this child, not the Vitest worker.
 */
import { buildTasty } from '../../../../../dist/tasty/build.mjs'

export async function buildProject(rootDir, outputDir) {
  const built = await buildTasty({ rootDir, include: ['**/*.{ts,tsx,mts,cts}'], outputDir })
  const manifest = await built.api.loadManifest()
  return {
    diagnostics: built.diagnostics.map(diagnostic => ({
      code: diagnostic.code,
      file: diagnostic.file ?? null,
      message: diagnostic.message,
    })),
    symbols: Object.values(manifest.symbolsById)
      .map(symbol => symbol.name)
      .sort(),
  }
}
