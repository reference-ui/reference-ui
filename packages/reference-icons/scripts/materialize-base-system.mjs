import { constants } from 'node:fs'
import { access } from 'node:fs/promises'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(packageRoot, 'dist')
const generatedBaseSystemMjsPath = resolve(packageRoot, '.reference-ui/system/baseSystem.mjs')
const generatedBaseSystemDtsPath = resolve(packageRoot, '.reference-ui/system/baseSystem.d.mts')

await access(generatedBaseSystemMjsPath, constants.F_OK)
await access(generatedBaseSystemDtsPath, constants.F_OK)
await mkdir(distDir, { recursive: true })

const generatedBaseSystemMjs = await readFile(generatedBaseSystemMjsPath, 'utf8')
const generatedBaseSystemDts = await readFile(generatedBaseSystemDtsPath, 'utf8')

await writeFile(resolve(distDir, 'baseSystem.mjs'), generatedBaseSystemMjs)
await writeFile(resolve(distDir, 'baseSystem.d.ts'), generatedBaseSystemDts)

const indexMjsPath = resolve(distDir, 'index.mjs')

try {
  await access(indexMjsPath, constants.F_OK)
} catch {
  process.exit(0)
}

const indexMjs = await readFile(indexMjsPath, 'utf8')
const localBaseSystemExport = "export { baseSystem } from './baseSystem.mjs';"
const generatedBaseSystemExport = "export { baseSystem } from './node_modules/@reference-ui/system/baseSystem.mjs';"

const normalizedLines = indexMjs
  .replace(generatedBaseSystemExport, localBaseSystemExport)
  .split('\n')
  .filter((line, index, lines) => {
    if (line !== localBaseSystemExport) return true
    return lines.indexOf(line) === index
  })

const normalizedIndexMjs = normalizedLines.join('\n')

if (!normalizedIndexMjs.includes(localBaseSystemExport)) {
  await writeFile(indexMjsPath, `${normalizedIndexMjs}\n${localBaseSystemExport}\n`)
} else if (normalizedIndexMjs !== indexMjs) {
  await writeFile(indexMjsPath, normalizedIndexMjs)
}