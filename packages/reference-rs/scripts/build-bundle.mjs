/**
 * JS bundle step for @reference-ui/rust: esbuild over the 12 published entries.
 * ESM-only, no dts or splitting. It takes the package checkout and emits the .mjs outputs into a staging directory beside
 * dist/, then publishes them one file at a time: each staged file is renamed over its dist path, which replaces the old file
 * in one step, so a reader of dist/ sees the old file or the new one and never a missing one. Only an output that the previous
 * bundle published and this one does not is removed, after the replacements; declarations are published by build-declarations.mjs.
 * The stamp is written last, through the same rename: dist/bundle.inputs.json, the digests of every file the bundle read and
 * every output it wrote (bundle-stamp.mjs), which the test runner checks before it loads dist. Only react stays external (the
 * primitives entry shares the consumer's copy); the manifest carries no runtime dependencies, so the external is a literal.
 * Run from the package dir: node scripts/build-bundle.mjs. Importing this file runs nothing: ENTRIES, bundleOptions() and
 * publishBundle() are exported so the stale-dist guard and the publish tests use the same bytes and the same steps.
 */
import { build } from 'esbuild'
import { copyFile, mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BUNDLE_OPTION_FILES, BUNDLE_STAMP_FILE, digestFile } from './bundle-stamp.mjs'

const PKG = dirname(dirname(fileURLToPath(import.meta.url)))
const DIST = join(PKG, 'dist')
const STAGE_SUFFIX = '.__stage'
// Windows refuses a rename over a file a reader still has open with one of these codes; the reader lets go soon after.
const RENAME_RETRY_CODES = new Set(['EPERM', 'EACCES', 'EBUSY'])
const RENAME_ATTEMPTS = 20
const RENAME_RETRY_MS = 50

// Same entries the tsup leg bundled: system aliases the atomic entry, and the
// committed roster module (primitives.mjs) bundles the authored trio in.
export const ENTRIES = {
  index: 'modules/runtime/js/index.ts',
  tasty: 'modules/tasty/js/index.ts',
  'tasty/browser': 'modules/tasty/js/browser.ts',
  'tasty/build': 'modules/tasty/js/build.ts',
  atlas: 'modules/atlas/js/index.ts',
  styletrace: 'modules/styletrace/js/index.ts',
  atomic: 'modules/atomic/js/index.ts',
  namer: 'modules/atomic/js/namer/index.ts',
  system: 'modules/atomic/js/index.ts',
  typegen: 'modules/typegen/js/index.ts',
  diagnostics: 'modules/diagnostics/js/index.ts',
  primitives: 'modules/primitives/generated/primitives.mjs',
}

// tsup parity: react external, everything else bundled. Literal because the
// manifest has no dependencies or peerDependencies to compute it from.
const EXTERNAL = ['react']

/** esbuild options for the published entries, minus the output location. */
export function bundleOptions(entryPoints) {
  return {
    absWorkingDir: PKG,
    entryPoints,
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    tsconfig: join(PKG, 'tsconfig.json'),
    // tsup used ["module", "main"] on platform node; keep the lookup order.
    mainFields: ['module', 'main'],
    external: EXTERNAL,
    splitting: false,
    sourcemap: false,
    minify: false,
    outExtension: { '.js': '.mjs' },
    logLevel: 'warning',
  }
}

async function collectFiles(dir) {
  const found = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...(await collectFiles(full)))
    else found.push(full)
  }
  return found
}

/** The staged outputs, as paths relative to the staging directory, sorted. */
async function collectOutputs(stageDir) {
  const files = await collectFiles(stageDir)
  return files.map(file => file.slice(stageDir.length + 1)).sort()
}

/** The outputs the previous bundle published, from its stamp. None when there is no readable stamp to trust. */
async function readPreviousOutputs(distDir) {
  try {
    const stamp = JSON.parse(await readFile(join(distDir, BUNDLE_STAMP_FILE), 'utf8'))
    return Object.keys(stamp.outputs ?? {})
  } catch {
    return []
  }
}

/**
 * Digests of the files the bundle reads: esbuild's module graph from a dry build that writes nothing, plus the
 * option files. They are taken before the real build reads anything, so a source saved during the build can
 * only leave the stamp stale, never make a stale bundle look fresh.
 */
async function bundleInputDigests() {
  const dry = await build({ ...bundleOptions(ENTRIES), outdir: DIST, write: false, metafile: true })
  const graph = Object.keys(dry.metafile.inputs).filter(rel => !rel.startsWith('<'))
  const rels = [...new Set([...graph, ...BUNDLE_OPTION_FILES])].sort()
  return Object.fromEntries(rels.map(rel => [rel, digestFile(join(PKG, rel))]))
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

/** rename() over `to`, retried on the codes a Windows reader can cause; any other failure goes to the caller. */
async function renameOver(from, to) {
  for (let attempt = 1; ; attempt++) {
    try {
      await rename(from, to)
      return
    } catch (error) {
      if (!RENAME_RETRY_CODES.has(error.code) || attempt >= RENAME_ATTEMPTS) throw error
      await delay(RENAME_RETRY_MS)
    }
  }
}

/**
 * Replaces `to` with the file at `from` in one step. The staged file is the temp: it sits beside dist/ on the same
 * filesystem, so rename() swaps the directory entry and a reader sees the old file or the new one. Across devices
 * rename() cannot do that, so the file is first copied to a temp beside `to` and renamed from there.
 */
async function replaceFile(from, to) {
  try {
    await renameOver(from, to)
  } catch (error) {
    if (error.code !== 'EXDEV') throw error
    const temp = `${to}.tmp-${process.pid}`
    await copyFile(from, temp)
    await renameOver(temp, to)
  }
}

/**
 * Publishes one bundle into `distDir`, one step at a time, and calls `onStep` after each step (the build logs them; the
 * publish tests sample the directory between them). Each staged output replaces its dist file in place. Then each output
 * that the previous bundle published and this one does not is removed. Then `writeStamp` runs, last, so the stamp never
 * describes an output that is not in place. A step that throws stops the publish where it is: nothing that is still current
 * was removed, and the stamp is not rewritten, so the dist reads as stale until a full build succeeds.
 */
export async function publishBundle({ stageDir, distDir, outputs, previousOutputs, writeStamp, onStep = () => {} }) {
  for (const rel of outputs) {
    const dest = join(distDir, rel)
    await mkdir(dirname(dest), { recursive: true })
    await replaceFile(join(stageDir, rel), dest)
    onStep({ type: 'replace', rel })
  }
  const current = new Set(outputs)
  for (const rel of previousOutputs) {
    if (current.has(rel)) continue
    await rm(join(distDir, rel), { force: true })
    onStep({ type: 'remove', rel })
  }
  await writeStamp()
  onStep({ type: 'stamp' })
}

/**
 * Writes the stamp through a temp file in the staging directory, then renames it into dist/, so a reader of the stamp
 * never sees a half-written file. The digests are taken from dist/ after the outputs are published.
 */
async function writeBundleStamp(inputs, outputs, stageDir) {
  const outputDigests = Object.fromEntries(outputs.map(rel => [rel, digestFile(join(DIST, rel))]))
  const stamp = { inputs, outputs: outputDigests }
  const temp = join(stageDir, BUNDLE_STAMP_FILE)
  await writeFile(temp, `${JSON.stringify(stamp, null, 2)}\n`)
  await replaceFile(temp, join(DIST, BUNDLE_STAMP_FILE))
  console.log(
    `build-bundle: wrote dist/${BUNDLE_STAMP_FILE} (${Object.keys(inputs).length} inputs, ${outputs.length} outputs)`,
  )
}

function logStep(step) {
  if (step.type === 'replace') console.log(`build-bundle: ${step.rel}`)
  if (step.type === 'remove') console.log(`build-bundle: removed obsolete ${step.rel}`)
}

async function buildBundle() {
  const stageDir = `${DIST}${STAGE_SUFFIX}-${process.pid}`
  await rm(stageDir, { recursive: true, force: true })
  const inputs = await bundleInputDigests()
  try {
    await build({ ...bundleOptions(ENTRIES), outdir: stageDir })
    const outputs = await collectOutputs(stageDir)
    if (outputs.length === 0) throw new Error('build-bundle: esbuild emitted no files')
    const previousOutputs = await readPreviousOutputs(DIST)
    await mkdir(DIST, { recursive: true })
    await publishBundle({
      stageDir,
      distDir: DIST,
      outputs,
      previousOutputs,
      writeStamp: () => writeBundleStamp(inputs, outputs, stageDir),
      onStep: logStep,
    })
  } finally {
    await rm(stageDir, { recursive: true, force: true })
  }
}

// Compare real paths: the module URL is resolved, while argv[1] keeps a symlinked spelling such as /var for /private/var.
if (process.argv[1] !== undefined && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await buildBundle()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
