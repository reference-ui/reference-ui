// React shell of the Neo generated folder.
// It takes the publish input and emits the final package manifest plus the stylesheet copy.
// The manifest is final (the packager owns it); the react bundler only adds the bundle and declarations beside it.

import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { copyPackageAssets } from '../../packager/assets.ts'
import { writePackageJson } from '../../packager/manifest.ts'
import { REACT_PACKAGE } from '../../packager/packages.ts'
import type { PublishInput } from '../../packager/types.ts'

// The stylesheet copy lands here (D5) as a filesystem copy of the styled
// leg's file, so the 14 MiB sheet is encoded once. Requires the styled leg
// to run first — the packager assembly orders the legs.
export function writeReactDir(input: PublishInput): void {
  const dir = join(input.outDir, 'react')
  mkdirSync(dir, { recursive: true })
  writePackageJson(dir, REACT_PACKAGE)
  copyPackageAssets(input.outDir, dir, REACT_PACKAGE)
}
