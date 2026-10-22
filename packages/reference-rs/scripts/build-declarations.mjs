/**
 * Declaration step for @reference-ui/rust, run after the bundle step of build:js. tsc emits the .d.ts files of modules/ and
 * contracts/, and create-dts-entrypoints writes the root stubs, both into a staging directory beside dist/. The staged set is
 * the whole declaration output of this run, so it is published with the bundle's rename: each declaration replaces its dist
 * file in one step, and a declaration that dist holds and the stage does not (a deleted source, a dropped entry) is removed
 * after the replacements. Only declaration files are touched; the native folders and the bundle outputs are left alone.
 * Run from the package dir: node scripts/build-declarations.mjs. Importing this file runs nothing: publishDeclarations() and
 * declarationFiles() are exported for the publish tests.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, realpathSync } from 'node:fs'
import { readdir, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { publishBundle } from './build-bundle.mjs'

const PKG = dirname(dirname(fileURLToPath(import.meta.url)))
const DIST = join(PKG, 'dist')
const STAGE_SUFFIX = '.__decl'
const CREATE_DTS = join(PKG, 'modules', 'runtime', 'js', 'tools', 'create-dts-entrypoints.mjs')
// Top-level folders of dist/ that belong to the native build; their files are not declarations.
const PRESERVED_DIST_DIRS = new Set(['cargo', 'native', 'npm', 'artifacts'])

/** Every declaration file under `root`, as a sorted path relative to it. Preserved top-level folders are skipped. */
export async function declarationFiles(root, preserved = new Set()) {
  const found = []
  await walkDeclarations(root, '', preserved, found)
  return found.sort()
}

async function walkDeclarations(root, rel, preserved, found) {
  for (const entry of await listDirectory(join(root, rel))) {
    if (isPreserved(rel, entry.name, preserved)) continue
    const child = rel === '' ? entry.name : `${rel}/${entry.name}`
    if (entry.isDirectory()) await walkDeclarations(root, child, preserved, found)
    else if (isDeclaration(entry.name)) found.push(child)
  }
}

/** The entries of `dir`, or none when it does not exist. */
async function listDirectory(dir) {
  try {
    return await readdir(dir, { withFileTypes: true })
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

function isPreserved(rel, name, preserved) {
  return rel === '' && preserved.has(name)
}

function isDeclaration(name) {
  return name.endsWith('.d.ts') || name.endsWith('.d.ts.map')
}

/**
 * Publishes the staged declarations into `distDir`. Each staged file replaces its dist file in place; then each
 * declaration dist holds that the stage does not is removed. `onStep` runs after each step, as in publishBundle.
 */
export async function publishDeclarations({ stageDir, distDir, onStep = () => {} }) {
  const outputs = await declarationFiles(stageDir)
  const previousOutputs = await declarationFiles(distDir, PRESERVED_DIST_DIRS)
  await publishBundle({ stageDir, distDir, outputs, previousOutputs, writeStamp: async () => {}, onStep })
  const current = new Set(outputs)
  return { published: outputs.length, removed: previousOutputs.filter(rel => !current.has(rel)) }
}

/** The tsc entry the typescript package declares as its bin, found through its exported package.json. */
function tscEntry() {
  const manifestPath = createRequire(import.meta.url).resolve('typescript/package.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  return join(dirname(manifestPath), manifest.bin.tsc)
}

function runStep(label, command, args) {
  const run = spawnSync(command, args, { cwd: PKG, stdio: 'inherit' })
  if (run.status !== 0) {
    throw new Error(`build-declarations: ${label} failed (${run.signal ?? `exit ${run.status}`})`)
  }
}

async function buildDeclarations() {
  const stageDir = `${DIST}${STAGE_SUFFIX}-${process.pid}`
  await rm(stageDir, { recursive: true, force: true })
  try {
    runStep('tsc', process.execPath, [tscEntry(), '-p', 'tsconfig.build.json', '--outDir', stageDir])
    runStep('create-dts-entrypoints', process.execPath, [CREATE_DTS, stageDir])
    const { published, removed } = await publishDeclarations({ stageDir, distDir: DIST })
    for (const rel of removed) console.log(`build-declarations: removed obsolete ${rel}`)
    console.log(`build-declarations: published ${published} declarations`)
  } finally {
    await rm(stageDir, { recursive: true, force: true })
  }
}

// Compare real paths: the module URL is resolved, while argv[1] keeps a symlinked spelling such as /var for /private/var.
if (process.argv[1] !== undefined && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await buildDeclarations()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
