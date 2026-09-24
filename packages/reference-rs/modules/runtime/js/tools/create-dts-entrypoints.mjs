/**
 * Generates root type declaration entrypoints in the distribution directory for published subpaths.
 * Takes the pre-compiled declaration files emitted by TypeScript under dist subdirectories.
 * Emits corresponding re-export stub declaration files at the package root level.
 * This guarantees seamless module resolution for downstream TypeScript consumers importing subpaths.
 * One target is carried, not compiled: tsc emits no output for .d.ts inputs, so the committed
 * primitives E4 ships by copy and its stub resolves the copy like every other entry.
 */
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const toolsDir = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(toolsDir, '../../../..', 'dist')

// E4 is committed generator output, not a tsc emit — copy it into dist so the stub below resolves.
const e4Target = resolve(distDir, 'modules/primitives/generated/primitives.d.ts')
mkdirSync(dirname(e4Target), { recursive: true })
copyFileSync(resolve(toolsDir, '../../../primitives/generated/primitives.d.ts'), e4Target)

const entrypoints = [
  { file: 'index.d.ts', target: './modules/runtime/js/index' },
  { file: 'tasty.d.ts', target: './modules/tasty/js/index' },
  { file: 'tasty/browser.d.ts', target: '../modules/tasty/js/browser' },
  { file: 'tasty/build.d.ts', target: '../modules/tasty/js/build' },
  { file: 'atlas.d.ts', target: './modules/atlas/js/index' },
  { file: 'styletrace.d.ts', target: './modules/styletrace/js/index' },
  { file: 'atomic.d.ts', target: './modules/atomic/js/index' },
  // Explicit `.js`: NodeNext/Node16 refuse the extensionless target the
  // legacy stubs keep for node10 resolvers. The namer is new, so no
  // node10 consumer exists to preserve; its importers resolve NodeNext.
  { file: 'namer.d.ts', target: './modules/atomic/js/namer/index.js' },
  { file: 'system.d.ts', target: './modules/atomic/js/index' },
  { file: 'typegen.d.ts', target: './modules/typegen/js/index' },
  // New like the namer, so the explicit `.js` NodeNext form (no node10 consumers).
  { file: 'primitives.d.ts', target: './modules/primitives/generated/primitives.js' },
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
