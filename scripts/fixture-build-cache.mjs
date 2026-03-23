import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { basename, join, relative, resolve } from 'node:path'

const packageRoot = process.cwd()
const repoRoot = resolve(packageRoot, '..', '..')
const packageJsonPath = join(packageRoot, 'package.json')
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))
const packageName = packageJson.name ?? basename(packageRoot)
const cacheFile = join(
  packageRoot,
  'node_modules',
  '.cache',
  'reference-ui',
  'fixture-build-state.json',
)

const selfInputs = [
  'package.json',
  'tsconfig.json',
  'tsup.config.ts',
  'ui.config.ts',
  'src',
  'scripts/bootstrap-runtime.mjs',
  'scripts/build-package.mjs',
]

const externalInputs = [
  '../../packages/reference-core/package.json',
  '../../packages/reference-core/dist/cli/index.mjs',
  '../../packages/reference-lib/package.json',
  '../../packages/reference-lib/.reference-ui/react/package.json',
  '../../packages/reference-lib/.reference-ui/react/react.mjs',
  '../../packages/reference-lib/.reference-ui/react/styles.css',
  '../../packages/reference-lib/.reference-ui/styled/package.json',
  '../../packages/reference-lib/.reference-ui/styled/styles.css',
  '../../packages/reference-lib/.reference-ui/system/package.json',
  '../../packages/reference-lib/.reference-ui/system/baseSystem.mjs',
  '../../packages/reference-lib/.reference-ui/system/system.mjs',
  '../../packages/reference-lib/.reference-ui/types/package.json',
  '../../packages/reference-lib/.reference-ui/types/manifest.js',
  '../../packages/reference-lib/.reference-ui/types/types.mjs',
]

const outputs = [
  'dist/index.mjs',
  'dist/index.d.ts',
  '.reference-ui/system/baseSystem.mjs',
  '.reference-ui/system/baseSystem.d.mts',
]

async function collectFiles(specs) {
  const files = []
  const missing = []

  async function walk(targetPath) {
    const info = await stat(targetPath)
    if (info.isDirectory()) {
      const entries = await readdir(targetPath, { withFileTypes: true })
      const sortedEntries = entries.sort((a, b) => a.name.localeCompare(b.name))
      for (const entry of sortedEntries) {
        await walk(join(targetPath, entry.name))
      }
      return
    }

    if (info.isFile()) files.push(targetPath)
  }

  for (const spec of specs) {
    const targetPath = resolve(packageRoot, spec)
    if (!existsSync(targetPath)) {
      missing.push(spec)
      continue
    }
    await walk(targetPath)
  }

  files.sort((a, b) => a.localeCompare(b))
  return { files, missing }
}

async function computeHash(inputFiles, missingSpecs) {
  const hash = createHash('sha256')
  hash.update(`${packageName}\n`)

  for (const spec of missingSpecs.sort()) {
    hash.update(`missing:${spec}\n`)
  }

  for (const filePath of inputFiles) {
    hash.update(`file:${relative(repoRoot, filePath)}\n`)
    hash.update(await readFile(filePath))
    hash.update('\n')
  }

  return hash.digest('hex')
}

async function outputsExist() {
  return outputs.every((output) => existsSync(resolve(packageRoot, output)))
}

async function isSeedable(inputFiles, missingSpecs) {
  if (missingSpecs.length > 0) return false
  if (!(await outputsExist())) return false

  let latestInputTime = 0
  for (const filePath of inputFiles) {
    const info = await stat(filePath)
    latestInputTime = Math.max(latestInputTime, info.mtimeMs)
  }

  let earliestOutputTime = Number.POSITIVE_INFINITY
  for (const output of outputs) {
    const info = await stat(resolve(packageRoot, output))
    earliestOutputTime = Math.min(earliestOutputTime, info.mtimeMs)
  }

  return latestInputTime <= earliestOutputTime
}

async function readPreviousState() {
  if (!existsSync(cacheFile)) return null
  try {
    return JSON.parse(await readFile(cacheFile, 'utf8'))
  } catch {
    return null
  }
}

async function writeState(hash, source) {
  await mkdir(resolve(cacheFile, '..'), { recursive: true })
  await writeFile(
    cacheFile,
    `${JSON.stringify(
      {
        packageName,
        hash,
        source,
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
  )
}

async function runFullBuild() {
  await new Promise((resolveBuild, rejectBuild) => {
    const child = spawn('pnpm', ['run', 'build:full'], {
      cwd: packageRoot,
      env: process.env,
      stdio: 'inherit',
    })

    child.on('error', rejectBuild)
    child.on('exit', (code) => {
      if (code === 0) {
        resolveBuild()
        return
      }
      rejectBuild(new Error(`build:full exited with code ${code}`))
    })
  })
}

const { files: selfFiles, missing: missingSelf } = await collectFiles(selfInputs)
const { files: externalFiles, missing: missingExternal } = await collectFiles(externalInputs)
const inputFiles = [...selfFiles, ...externalFiles]
const missingSpecs = [...missingSelf, ...missingExternal]
const hash = await computeHash(inputFiles, missingSpecs)
const previousState = await readPreviousState()

if (previousState?.hash === hash && (await outputsExist())) {
  console.log(`[fixture-build-cache] ${packageName}: up to date`)
  process.exit(0)
}

if (!previousState && (await isSeedable(inputFiles, missingSpecs))) {
  await writeState(hash, 'seeded-from-existing-outputs')
  console.log(`[fixture-build-cache] ${packageName}: seeded cache from current outputs`)
  process.exit(0)
}

console.log(`[fixture-build-cache] ${packageName}: cache miss, running build:full`)
await runFullBuild()
await writeState(hash, 'build:full')
console.log(`[fixture-build-cache] ${packageName}: build complete`)
