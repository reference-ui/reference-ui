// System leg of the Neo generated folder.
// It takes the publish input and emits the authoring entry, the evaluated
// spec, the jsx artifact, the portable base system, and the package manifest.
// The published base system is the singular BaseSystem shape the extends
// validator and reader consume: name plus the bundled fragment string.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { assembleBaseSystem } from '../system/base/assemble.ts'
import {
  baseSystemMjsSource,
  baseSystemTypesSource,
  systemEntrySource,
  systemTypesSource,
} from '../system/base/sources.ts'
import { writePackageJson } from './manifest.ts'
import { SYSTEM_PACKAGE } from './packages.ts'
import type { PublishInput } from './types.ts'

export function writeSystemDir(input: PublishInput): void {
  const dir = join(input.outDir, 'system')
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, 'baseSystem.mjs'),
    baseSystemMjsSource(
      assembleBaseSystem({
        name: input.spec.name,
        fragment: input.portableFragment,
        streams: input.streams,
        jsxElements: input.jsx.merged,
      })
    ),
    'utf-8'
  )
  writeFileSync(join(dir, 'baseSystem.d.mts'), baseSystemTypesSource(), 'utf-8')
  writeFileSync(join(dir, 'system.mjs'), systemEntrySource(), 'utf-8')
  writeFileSync(join(dir, 'system.d.mts'), systemTypesSource(), 'utf-8')
  writeFileSync(join(dir, 'evaluated-system.json'), `${JSON.stringify(input.spec, null, 2)}\n`, 'utf-8')
  writeFileSync(join(dir, 'jsx-elements.json'), `${JSON.stringify(input.jsx, null, 2)}\n`, 'utf-8')
  writePackageJson(dir, SYSTEM_PACKAGE)
}
