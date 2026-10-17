// Package the generated runtime into dist so published reference-lib resolves
// stable relative files instead of relying on nested node_modules paths.
// Each target is written whole into a sibling `<target>.__stage-<pid>` and then
// swapped in by rename, so a rebuild never leaves dist/ missing or half-written.
import { constants } from 'node:fs'
import {
  access,
  chmod,
  cp,
  lstat,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(packageRoot, 'dist')
const generatedRoot = resolve(packageRoot, '.reference-ui')
const packagedRuntimeDir = resolve(distDir, 'runtime/reference-ui')
const generatedTastyDir = resolve(generatedRoot, 'types/tasty')
const packagedTastyDir = resolve(distDir, 'tasty')
const bundleIndexFile = resolve(distDir, 'index.mjs')
const generatedTypesFile = resolve(generatedRoot, 'types/types.d.mts')
const generatedTypesRuntime = resolve(generatedRoot, 'types/types.mjs')

const runtimePackages = ['react', 'styled']

const runtimeRewrites = [
  ['@reference-ui/styled/css/cva', '../styled/css/cva.js'],
  ['@reference-ui/styled/types/prop-type', '../styled/types/prop-type.d.ts'],
  ['@reference-ui/styled/types/style-props', '../styled/types/style-props.d.ts'],
  ['@reference-ui/styled/types/conditions', '../styled/types/conditions.d.ts'],
  ['@reference-ui/styled/types/recipe', '../styled/types/recipe.d.ts'],
  ['@reference-ui/styled/types', '../styled/types/index.d.ts'],
  ['@reference-ui/styled/css', '../styled/css/index.js'],
  ['@reference-ui/styled/jsx', '../styled/jsx/index.js'],
  ['@reference-ui/styled/patterns/box', '../styled/patterns/box.js'],
  // The generated react.d.mts references the BARE specifier twice
  // (import + `export type *`). It must be rewritten last so subpath entries
  // above win. Target is the extensionful index so every moduleResolution
  // mode lands on styled/index.d.ts.
  ['@reference-ui/styled', '../styled/index.js'],
]

const bundleRewrites = [
  ['@reference-ui/styled/css/cva', './runtime/reference-ui/styled/css/cva.js'],
  ['@reference-ui/react', './runtime/reference-ui/react/react.mjs'],
  ['@reference-ui/styled/css', './runtime/reference-ui/styled/css/index.js'],
  ['@reference-ui/styled/jsx', './runtime/reference-ui/styled/jsx/index.js'],
  ['@reference-ui/styled/patterns/box', './runtime/reference-ui/styled/patterns/box.js'],
]

// Same staging convention as reference-mcp's build-bundle.mjs.
const STAGE_SUFFIX = '.__stage'
const ASIDE_SUFFIX = '.__old'
const STAGE_LEFTOVER = /^(.+)\.__(?:stage|old)-(\d+)$/

function stagePath(target) {
  return `${target}${STAGE_SUFFIX}-${process.pid}`
}

// Every write lands through a sibling stage file renamed over the target, so a
// reader never sees a truncated file. A new file gets its mode from umask, so the
// old file's mode is copied onto the stage file before the rename.
async function writeAtomic(filePath, content) {
  const stage = stagePath(filePath)
  const { mode } = await stat(filePath)
  await writeFile(stage, content)
  await chmod(stage, mode & 0o7777)
  await rename(stage, filePath)
}

async function rewriteSpecifiers(filePath, replacements) {
  let content = await readFile(filePath, 'utf8')
  for (const [from, to] of replacements) {
    content = content.replaceAll(from, to)
  }
  await writeAtomic(filePath, content)
}

// EPERM means the pid exists under another user, so it still counts as alive.
function isAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error.code === 'EPERM'
  }
}

// A stage or aside left behind by a crashed run carries a pid that is gone; those
// are removed. A live pid belongs to a concurrent build and is left alone.
async function clearStaleStages(target) {
  const parent = dirname(target)
  for (const name of await readdir(parent)) {
    const match = STAGE_LEFTOVER.exec(name)
    if (!match || match[1] !== basename(target) || isAlive(Number(match[2]))) continue
    await rm(join(parent, name), { recursive: true, force: true })
  }
}

// A non-empty directory cannot be renamed over, so the live one is renamed aside
// first. The gap is the two back-to-back renames; if the second fails, the old
// directory is put back.
async function swapDirIn(stage, target) {
  const aside = `${target}${ASIDE_SUFFIX}-${process.pid}`
  await rm(aside, { recursive: true, force: true })
  const hadOld = await lstat(target).then(() => true, () => false)
  if (hadOld) await rename(target, aside)
  try {
    await rename(stage, target)
  } catch (error) {
    if (hadOld) await rename(aside, target)
    throw error
  }
  await rm(aside, { recursive: true, force: true })
}

// Check every input before dist/ is touched, so a missing input leaves dist as it was.
for (const packageName of runtimePackages) {
  await access(resolve(generatedRoot, packageName), constants.F_OK)
}
await access(generatedTastyDir, constants.F_OK)
await access(generatedTypesFile, constants.F_OK)
await access(generatedTypesRuntime, constants.F_OK)
await access(bundleIndexFile, constants.F_OK)

// The runtime directory is built whole, so react, styled and types always appear together.
await mkdir(dirname(packagedRuntimeDir), { recursive: true })
await clearStaleStages(packagedRuntimeDir)
const runtimeStage = stagePath(packagedRuntimeDir)
await rm(runtimeStage, { recursive: true, force: true })
await mkdir(runtimeStage)
for (const packageName of runtimePackages) {
  const sourceDir = resolve(generatedRoot, packageName)
  await cp(sourceDir, join(runtimeStage, packageName), { recursive: true })
}

// @reference-ui/types is the generated single-file declaration surface that the
// Reference declarations import as `types.mjs`. TypeScript reads that name through
// the `types.d.mts` beside it, and tasty reports the import unresolved unless a file
// of that name exists, so the runtime ships too. Nothing loads it at runtime: the
// declarations that import it are type-only. rewrite-declaration-specifiers points
// those imports at this copy.
await mkdir(join(runtimeStage, 'types'))
await cp(generatedTypesFile, join(runtimeStage, 'types/types.d.mts'))
await cp(generatedTypesRuntime, join(runtimeStage, 'types/types.mjs'))

await rewriteSpecifiers(join(runtimeStage, 'react/react.mjs'), runtimeRewrites)
await rewriteSpecifiers(join(runtimeStage, 'react/react.d.mts'), runtimeRewrites)
await swapDirIn(runtimeStage, packagedRuntimeDir)

// The packaged runtime lazy-imports `./tasty/runtime.js`, resolved relative
// to dist/index.mjs. runtime.js statically imports ./chunk-registry.js and
// ./manifest.js; its 550 ./chunks/*.js edges are runtime-computed, so the
// whole generated dir is copied verbatim — runtime.js alone is insufficient.
const tastyStage = stagePath(packagedTastyDir)
await clearStaleStages(packagedTastyDir)
await rm(tastyStage, { recursive: true, force: true })
await cp(generatedTastyDir, tastyStage, { recursive: true })
await swapDirIn(tastyStage, packagedTastyDir)

// dist/index.mjs is produced by the bundle step, not here. It is rewritten
// through a stage file too, so a reader never sees it half-written.
await clearStaleStages(bundleIndexFile)
await rewriteSpecifiers(bundleIndexFile, bundleRewrites)
