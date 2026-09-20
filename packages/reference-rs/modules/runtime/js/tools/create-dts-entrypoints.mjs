/**
 * Generates root type declaration entrypoints in the distribution directory for published subpaths.
 * Takes the pre-compiled declaration files emitted by TypeScript under dist subdirectories.
 * Emits corresponding re-export stub declaration files at the package root level.
 * This guarantees seamless module resolution for downstream TypeScript consumers importing subpaths.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const distDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..', 'dist')

const entrypoints = [
  { file: 'index.d.ts', target: './modules/runtime/js/index' },
  { file: 'tasty.d.ts', target: './modules/tasty/js/index' },
  { file: 'tasty/browser.d.ts', target: '../modules/tasty/js/browser' },
  { file: 'tasty/build.d.ts', target: '../modules/tasty/js/build' },
  { file: 'atlas.d.ts', target: './modules/atlas/js/index' },
  { file: 'styletrace.d.ts', target: './modules/styletrace/js/index' },
  { file: 'atomic.d.ts', target: './modules/atomic/js/index' },
  { file: 'namer.d.ts', target: './modules/atomic/js/namer/index' },
  { file: 'system.d.ts', target: './modules/atomic/js/index' },
  { file: 'typegen.d.ts', target: './modules/typegen/js/index' },
]

for (const { file, target } of entrypoints) {
  const filePath = resolve(distDir, file)
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(
    filePath,
    `export * from '${target}'\nexport { default } from '${target}'\n`,
    'utf8'
  )
}
