// Styled leg of the Neo generated folder.
// It takes the publish input and emits the stylesheet plus the package
// manifest, then the runtime data beside it and the staged base system once.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { NativeRuntimeArtifact } from '@reference-ui/rust/contracts'
import { BASE_SYSTEM_HEADER, GENERATED_VERSION, type PublishInput } from './types.ts'
import { baseSystemMjsSource, takeStagedBaseSystem } from './system.ts'

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
        types: './index.d.ts',
        exports: {
          '.': { types: './index.d.ts', import: './runtime-data.mjs' },
          './runtime-data': { import: './runtime-data.mjs' },
          './styles.css': './styles.css',
          './tokens': { types: './tokens.d.ts' },
          './types': { types: './types/index.d.ts' },
          './types/*': { types: './types/*.d.ts' },
        },
      },
      null,
      2
    )}\n`,
    'utf-8'
  )
}

/**
 * Publish the styled runtime data beside the stylesheet: the compiled plans
 * as pure data. Styled is data-only (D4): no executable css module lives
 * here — the bound css()/recipe() bundle into the react entry, which worlds
 * import through an import map while the compiler extracts the same calls.
 * Also finalizes the staged portable base system with the real runtime, so
 * baseSystem.mjs is serialized and written exactly once.
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
  const staged = takeStagedBaseSystem(outDir)
  if (staged === undefined) return
  staged.runtime = runtime
  writeFileSync(join(outDir, 'system', 'baseSystem.mjs'), baseSystemMjsSource(staged), 'utf-8')
}
