// System leg of the Neo generated folder.
// It takes the publish input and emits the authoring entry, the evaluated
// spec, the jsx artifact, the portable base system, and the package manifest.
// The published base system is the BaseSystem shape the extends validator and
// reader consume: name, the bundled fragment string, and the named fragment list.
// The owned prop map prints in the jsx artifact and the base system only when it
// names a prop, so a roster without owned data keeps the bytes it always had.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { assembleBaseSystem } from '../system/base/assemble.ts'
import { publishedJsxElements } from '../system/base/jsx.ts'
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
  const baseSystem = assembleBaseSystem({
    name: input.spec.name,
    fragment: input.portableFragment,
    fragments: input.portableFragments,
    streams: input.streams,
    jsxElements: input.jsx.merged,
    jsxOwned: input.jsx.owned,
  })
  writeFileSync(join(dir, 'baseSystem.mjs'), baseSystemMjsSource(baseSystem), 'utf-8')
  writeFileSync(join(dir, 'baseSystem.d.mts'), baseSystemTypesSource(baseSystem), 'utf-8')
  writeFileSync(join(dir, 'system.mjs'), systemEntrySource(), 'utf-8')
  writeFileSync(join(dir, 'system.d.mts'), systemTypesSource(baseSystem), 'utf-8')
  writeFileSync(join(dir, 'evaluated-system.json'), `${JSON.stringify(input.spec, null, 2)}\n`, 'utf-8')
  writeFileSync(join(dir, 'jsx-elements.json'), `${JSON.stringify(publishedJsxElements(input.jsx), null, 2)}\n`, 'utf-8')
  writePackageJson(dir, SYSTEM_PACKAGE)
}
