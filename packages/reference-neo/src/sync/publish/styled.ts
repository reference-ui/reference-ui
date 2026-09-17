// Styled leg of the Neo generated folder.
// It takes the publish input and emits the stylesheet plus the package
// manifest, then backfills the runtime data and the portable base system.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { NativeRuntimeArtifact, PortableBaseSystem } from '@reference-ui/rust/contracts'
import { BASE_SYSTEM_HEADER, GENERATED_VERSION, type PublishInput } from './types.ts'

export function writeStyledDir(input: PublishInput): void {
  const dir = join(input.outDir, 'styled')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'styles.css'), input.stylesheet, 'utf-8')
  writeFileSync(
    join(dir, 'package.json'),
    `${JSON.stringify(
      {
        name: '@reference-ui/styled',
        version: GENERATED_VERSION,
        description: 'Neo generated styled output',
        type: 'module',
        main: './runtime-data.mjs',
        exports: {
          '.': { import: './runtime-data.mjs' },
          './runtime-data': { import: './runtime-data.mjs' },
          './styles.css': './styles.css',
        },
      },
      null,
      2
    )}\n`,
    'utf-8'
  )
}

function patchBaseSystemRuntime(outDir: string, runtime: NativeRuntimeArtifact): void {
  const baseSystemPath = join(outDir, 'system', 'baseSystem.mjs')
  if (!existsSync(baseSystemPath)) return
  const raw = readFileSync(baseSystemPath, 'utf-8')
  const parsed = JSON.parse(raw.slice(raw.indexOf('{'))) as PortableBaseSystem
  parsed.runtime = runtime
  writeFileSync(
    baseSystemPath,
    `${BASE_SYSTEM_HEADER}\nexport const baseSystem = ${JSON.stringify(parsed, null, 2)}\n`,
    'utf-8'
  )
}

/**
 * Publish the styled runtime data beside the stylesheet: the compiled plans
 * as pure data. Styled is data-only (D4): no executable css module lives
 * here — the bound css()/recipe() bundle into the react entry, which worlds
 * import through an import map while the compiler extracts the same calls.
 * Also backfills the portable base system runtime written one step earlier.
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
  patchBaseSystemRuntime(outDir, runtime)
}
