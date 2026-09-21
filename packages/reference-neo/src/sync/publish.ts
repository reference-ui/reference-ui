// Publishing for the minimal Neo generated folder.
// It takes compile output plus the spec and emits system, styled, and react
// through the per-leg publishers. The system leg writes the PortableBaseSystem
// plus the authoring entry; the css, recipes, and types legs grow the styled
// and react legs when they land.

import { mkdirSync } from 'node:fs'
import type { PublishInput } from './publish/types.ts'
import { writeSystemDir } from './publish/system.ts'
import { writeStyledDir } from './publish/styled.ts'
import { writeReactDir } from './publish/react-shell.ts'

export { GENERATED_VERSION, type PublishInput } from './publish/types.ts'
export { publishRuntimeBundle } from './publish/styled.ts'
export { linkGeneratedPackages } from './publish/links.ts'
export { publishTypesBundle } from './publish/types-bundle.ts'

export function publishSyncFolder(input: PublishInput): void {
  mkdirSync(input.outDir, { recursive: true })
  // Ordered: the system leg stages baseSystem.mjs for publishRuntimeBundle,
  // and the react leg copies the styled leg's stylesheet.
  writeSystemDir(input)
  writeStyledDir(input)
  writeReactDir(input)
}
