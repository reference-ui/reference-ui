// Assembly for Neo generated packages.
// It takes the assembly input sync builds from compile output and emits the complete generated folder plus its project links, in dependency order.
// The order is the contract: shells before the bundles that read them, bundles before the links that publish them. The legs live beside the assembly; sync calls this one entry with the compile output.

import { mkdirSync } from 'node:fs'
import { writeSystemDir } from './system.ts'
import { publishRuntimeBundle, writeStyledDir } from './styled.ts'
import { writeReactDir } from './react-shell.ts'
import { linkGeneratedPackages } from './links.ts'
import { publishTypesBundle } from './types-bundle.ts'
import { publishReactBundle } from './react.ts'
import { publishReferenceTypesBundle } from './reference-types.ts'
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
