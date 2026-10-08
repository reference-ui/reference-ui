// Styled leg of the Neo generated folder.
// It takes the publish input and emits the stylesheet plus the package
// manifest, then the runtime data beside it.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { NativeRuntimeArtifact } from '@reference-ui/rust/contracts'
import { BASE_SYSTEM_HEADER } from './constants.ts'
import { writePackageJson } from './manifest.ts'
import { STYLED_PACKAGE } from './packages.ts'
import type { PublishInput } from './types.ts'

export function writeStyledDir(input: PublishInput): void {
  const dir = join(input.outDir, 'styled')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'styles.css'), input.stylesheet, 'utf-8')
  writePackageJson(dir, STYLED_PACKAGE)
}

/**
 * Publish the styled runtime data beside the stylesheet: the compiled plans
 * as pure data. Styled is data-only (D4): no executable css module lives
 * here — the bound css()/recipe() bundle into the react entry, which worlds
 * import through an import map while the compiler extracts the same calls.
 */
export function publishRuntimeBundle(
  outDir: string,
  systemName: string,
  runtime: NativeRuntimeArtifact
): void {
  const dir = join(outDir, 'styled')
  mkdirSync(dir, { recursive: true })
  const dataPath = join(dir, 'runtime-data.mjs')
  writeFileSync(
    dataPath,
    `${BASE_SYSTEM_HEADER}\nexport const systemName = ${JSON.stringify(systemName)}\nexport const runtimeData = ${JSON.stringify(runtime)}\n`,
    'utf-8'
  )
}
