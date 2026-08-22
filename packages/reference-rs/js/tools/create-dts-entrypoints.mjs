import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const distDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist')

const entrypoints = [
  { file: 'index.d.ts', target: './runtime/index' },
  { file: 'tasty.d.ts', target: './tasty/index' },
  { file: 'atlas.d.ts', target: './atlas/index' },
  { file: 'styletrace.d.ts', target: './styletrace/index' },
]

for (const { file, target } of entrypoints) {
  writeFileSync(resolve(distDir, file), `export * from '${target}'\nexport { default } from '${target}'\n`, 'utf8')
}
