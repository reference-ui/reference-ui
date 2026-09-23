// Assembly for Neo generated packages.
// It takes the assembly input sync builds from compile output and emits the complete generated folder plus its project links, in dependency order.
// The order is the contract: shells before the bundles that read them, bundles before the links that publish them. Legs still live under sync/ (their move here is Tokyo item-3-owned); the assembly already lives where they are headed.

import { mkdirSync } from 'node:fs'
import { writeSystemDir } from '../sync/publish/system.ts'
import { publishRuntimeBundle, writeStyledDir } from '../sync/publish/styled.ts'
import { writeReactDir } from '../sync/publish/react-shell.ts'
import { linkGeneratedPackages } from '../sync/publish/links.ts'
import { publishTypesBundle } from '../sync/publish/types-bundle.ts'
import { publishReactBundle } from '../sync/react.ts'
import { publishReferenceTypesBundle } from '../sync/reference-types.ts'
import type { AssemblyInput } from './types.ts'

/**
 * Assemble the generated folder: shells, data, bundles, declarations, then
 * links. Called once per sync with the compile output; failures propagate
 * to sync, which owns the atomicity wipe.
 */
export async function assembleSystem(cwd: string, input: AssemblyInput): Promise<void> {
  mkdirSync(input.outDir, { recursive: true })
  // Ordered: the styled leg stages the stylesheet the react shell copies,
  // and the react leg reads the styled leg's runtime data.
  writeSystemDir(input)
  writeStyledDir(input)
  writeReactDir(input)
  publishRuntimeBundle(input.outDir, input.spec.name, input.runtime)
  await publishReactBundle({
    outDir: input.outDir,
    systemName: input.spec.name,
    stylePropNames: input.runtime.stylePropNames,
  })
  await publishTypesBundle(input.outDir, input.spec)
  // After the react leg (its bundle is the alias target) and before the
  // links leg (the junction lands on a complete package).
  await publishReferenceTypesBundle({ outDir: input.outDir })
  linkGeneratedPackages(cwd, input.outDir)
}
