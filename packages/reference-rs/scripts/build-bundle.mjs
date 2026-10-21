/**
 * JS bundle step for @reference-ui/rust: esbuild over the 12 published entries.
 * ESM-only, no dts or splitting. It
 * takes the package checkout and emits staged .mjs outputs, cleaning stale JS
 * from dist/ only after a successful build and renaming each output in
 * atomically, so a failed build never leaves a half-empty dist/. Only react
 * stays external (the primitives entry shares the consumer's copy); the
 * manifest carries no runtime dependencies, so the external is a literal, not
 * manifest-computed. Run from the package dir: node scripts/build-bundle.mjs.
 * After the outputs are in place it writes dist/bundle.inputs.json, the digests of
 * every file the bundle read and every output it wrote (bundle-stamp.mjs), which the
 * test runner checks before it loads dist. Importing it runs nothing: ENTRIES and
 * bundleOptions() are exported so the stale-dist guard in tests builds the same bytes.
 */
import { build } from 'esbuild'
import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { BUNDLE_OPTION_FILES, BUNDLE_STAMP_FILE, digestFile } from './bundle-stamp.mjs'

const PKG = dirname(dirname(fileURLToPath(import.meta.url)))
const DIST = join(PKG, 'dist')
const STAGE_SUFFIX = '.__stage'

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

// Non-JS dist subtrees the tsup leg preserved across rebuilds; the tsc leg
// regenerates declarations (modules/, contracts/, *.d.ts) after this step.
const PRESERVED_DIST_DIRS = new Set(['cargo', 'native', 'npm', 'artifacts'])

async function collectFiles(dir) {
  const found = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...(await collectFiles(full)))
    else found.push(full)
  }
  return found
}

async function cleanStaleJsOutputs(distDir) {
  let entries
  try {
    entries = await readdir(distDir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (PRESERVED_DIST_DIRS.has(entry.name)) continue
    await rm(join(distDir, entry.name), { recursive: true, force: true })
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

async function buildBundle() {
  const stageDir = `${DIST}${STAGE_SUFFIX}-${process.pid}`
  await rm(stageDir, { recursive: true, force: true })
  const inputs = await bundleInputDigests()
  try {
    await build({ ...bundleOptions(ENTRIES), outdir: stageDir })
  } catch (error) {
    await rm(stageDir, { recursive: true, force: true })
    throw error
  }

  const emitted = await collectFiles(stageDir)
  if (emitted.length === 0) {
    await rm(stageDir, { recursive: true, force: true })
    throw new Error('build-bundle: esbuild emitted no files')
  }
  // Clean only after the build succeeds, so a failed build never wipes good dist/.
  await cleanStaleJsOutputs(DIST)
  await mkdir(DIST, { recursive: true })
  const outputs = []
  for (const file of emitted) {
    const rel = file.slice(stageDir.length + 1)
    const dest = join(DIST, rel)
    await mkdir(dirname(dest), { recursive: true })
    await rename(file, dest)
    outputs.push(rel)
    console.log(`build-bundle: ${rel}`)
  }
  await rm(stageDir, { recursive: true, force: true })
  await writeBundleStamp(inputs, outputs)
}

async function writeBundleStamp(inputs, outputs) {
  const outputDigests = Object.fromEntries(
    outputs.sort().map(rel => [rel, digestFile(join(DIST, rel))]),
  )
  const stamp = { inputs, outputs: outputDigests }
  await writeFile(join(DIST, BUNDLE_STAMP_FILE), `${JSON.stringify(stamp, null, 2)}\n`)
  console.log(
    `build-bundle: wrote dist/${BUNDLE_STAMP_FILE} (${Object.keys(inputs).length} inputs, ${outputs.length} outputs)`,
  )
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await buildBundle()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
