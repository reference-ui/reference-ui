// Assembly for Neo generated packages.
// It takes the assembly input sync builds from compile output and emits the complete generated folder in dependency order, plus the typegen diagnostics the declaration leg raised.
// The order is the contract: shells before the bundles that read them. The legs live beside the assembly; sync calls this one entry with the compile output, commits the result live, then links the packages.

import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { writeSystemDir } from './system.ts'
import { publishRuntimeBundle, writeStyledDir } from './styled.ts'
import { writeReactDir } from './react-shell.ts'
import { publishTypesBundle } from './types-bundle.ts'
import { publishReactBundle } from './react.ts'
import { publishReferenceTypesBundle } from './reference-types.ts'
import { stampContentVersions } from './content-version.ts'
import { detectSyncedRole, type SyncedRole } from './synced-role.ts'
import type { NeoDiagnostic } from '../diagnostics/types.ts'
import type { AssemblyInput } from './types.ts'

/**
 * Synced role of the project that owns a live generated folder. The out dir is
 * `<project>/.reference-ui`, so the project root is its parent; the role decides
 * what the react leg declares for SyncedSystem.
 */
export function syncedRoleFor(liveOutDir: string): SyncedRole {
  return detectSyncedRole(dirname(liveOutDir))
}

/**
 * Assemble the generated folder: shells, data, bundles, declarations. Called
 * once per sync with the compile output; failures propagate to sync, which
 * drops the stage and keeps the last-good folder. Sync commits the result
 * live and links the packages after — never this entry. Returns the typegen
 * warnings so sync reports them with the compile warnings.
 */
export async function assembleSystem(input: AssemblyInput): Promise<NeoDiagnostic[]> {
  mkdirSync(input.outDir, { recursive: true })
  // Ordered: the styled leg stages the stylesheet the react shell copies,
  // and the react leg reads the styled leg's runtime data.
  writeSystemDir(input)
  writeStyledDir(input)
  writeReactDir(input)
  publishRuntimeBundle(input.outDir, input.spec.name, input.runtime)
  await publishReactBundle({
    outDir: input.outDir,
    liveOutDir: input.liveOutDir,
    systemName: input.spec.name,
    stylePropNames: input.runtime.stylePropNames,
    recipes: input.spec.recipes,
    role: syncedRoleFor(input.liveOutDir),
  })
  const typegenDiagnostics = await publishTypesBundle(input.outDir, input.spec, input.strict)
  // After the react leg: its bundle is the alias target this leg reads.
  await publishReferenceTypesBundle({ outDir: input.outDir })
  // Last: a package's version hashes its files, so every leg must have written them.
  stampContentVersions(input.outDir)
  return typegenDiagnostics
}
