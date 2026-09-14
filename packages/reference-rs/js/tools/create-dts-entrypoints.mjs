/**
 * Generates root type declaration entrypoints in the distribution directory for published subpaths.
 * Takes the pre-compiled declaration files emitted by TypeScript under dist subdirectories.
 * Emits corresponding re-export stub declaration files at the package root level.
 * This guarantees seamless module resolution for downstream TypeScript consumers importing subpaths.
 */
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const distDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist')

const entrypoints = [
  { file: 'index.d.ts', target: './runtime/index' },
  { file: 'tasty.d.ts', target: './tasty/index' },
  { file: 'atlas.d.ts', target: './atlas/index' },
  { file: 'styletrace.d.ts', target: './styletrace/index' },
  { file: 'system.d.ts', target: './system/index' },
]

for (const { file, target } of entrypoints) {
  writeFileSync(resolve(distDir, file), `export * from '${target}'\nexport { default } from '${target}'\n`, 'utf8')
}
