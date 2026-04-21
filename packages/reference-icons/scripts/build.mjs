import { execSync } from 'node:child_process'
import { constants } from 'node:fs'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(packageRoot, 'dist')
const generatedBaseSystemMjsPath = resolve(packageRoot, '.reference-ui/system/baseSystem.mjs')
const generatedBaseSystemDtsPath = resolve(packageRoot, '.reference-ui/system/baseSystem.d.mts')

const requiredFiles = [
  generatedBaseSystemMjsPath,
  generatedBaseSystemDtsPath,
  resolve(distDir, 'baseSystem.mjs'),
  resolve(distDir, 'baseSystem.d.ts'),
  resolve(distDir, 'index.mjs'),
  resolve(distDir, 'index.d.ts'),
]

function run(command) {
  execSync(command, { cwd: packageRoot, stdio: 'inherit', env: process.env })
}

run('pnpm run sync')
run('pnpm run build:lib')
run('pnpm run build:types')

for (const filePath of requiredFiles) {
  await access(filePath, constants.F_OK)
}

const generatedBaseSystemMjs = await readFile(generatedBaseSystemMjsPath, 'utf8')
const generatedBaseSystemDts = await readFile(generatedBaseSystemDtsPath, 'utf8')

await writeFile(resolve(distDir, 'baseSystem.mjs'), generatedBaseSystemMjs)
await writeFile(resolve(distDir, 'baseSystem.d.ts'), generatedBaseSystemDts)

const indexMjsPath = resolve(distDir, 'index.mjs')
const indexMjs = await readFile(indexMjsPath, 'utf8')
const baseSystemExport = "export { baseSystem } from './baseSystem.mjs';\n"
const generatedBaseSystemExport = "export { baseSystem } from './node_modules/@reference-ui/system/baseSystem.mjs';"

const normalizedLines = indexMjs
  .replace(generatedBaseSystemExport, baseSystemExport.trimEnd())
  .split('\n')
  .filter((line, index, lines) => {
    if (line !== baseSystemExport.trimEnd()) return true
    return lines.indexOf(line) === index
  })

const normalizedIndexMjs = normalizedLines.join('\n')

if (!normalizedIndexMjs.includes(baseSystemExport.trimEnd())) {
  await writeFile(indexMjsPath, `${baseSystemExport}${normalizedIndexMjs}`)
} else if (normalizedIndexMjs !== indexMjs) {
  await writeFile(indexMjsPath, normalizedIndexMjs)
}

await mkdir(distDir, { recursive: true })