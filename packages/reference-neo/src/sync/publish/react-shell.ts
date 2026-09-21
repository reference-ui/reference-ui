// React shell of the Neo generated folder.
// It takes the publish input and emits the placeholder package plus the
// stylesheet copy. The react bundler rewrites the manifest once the entry
// bundle lands, keeping this shell free of bundle concerns.

import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { GENERATED_VERSION, type PublishInput } from './types.ts'

// The stylesheet copy lands here (D5) as a filesystem copy of the styled
// leg's file, so the 14 MiB sheet is encoded once. Requires the styled leg
// to run first — publishSyncFolder orders the legs.
export function writeReactDir(input: PublishInput): void {
  const dir = join(input.outDir, 'react')
  mkdirSync(dir, { recursive: true })
  // react.ts rewrites this placeholder package.json with the D5 exports map
  // once the entry bundles.
  writeFileSync(
    join(dir, 'package.json'),
    `${JSON.stringify(
      {
        name: '@reference-ui/react',
        version: GENERATED_VERSION,
        description: 'Neo generated React entry',
        type: 'module',
      },
      null,
      2
    )}\n`,
    'utf-8'
  )
  copyFileSync(join(input.outDir, 'styled', 'styles.css'), join(dir, 'styles.css'))
}
