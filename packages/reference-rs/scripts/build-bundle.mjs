/**
 * JS bundle step for @reference-ui/rust (docs/archive/BUNDLER_UNIFICATION.md Arc D): raw
 * esbuild over the 12 tsup-parity entries, ESM-only, no dts or splitting. It
 * takes the package checkout and emits staged .mjs outputs, cleaning stale JS
 * from dist/ only after a successful build and renaming each output in
 * atomically, so a failed build never leaves a half-empty dist/. Only react
 * stays external (the primitives entry shares the consumer's copy); the
 * manifest carries no runtime dependencies, so the external is a literal, not
 * manifest-computed. Run from the package dir: node scripts/build-bundle.mjs
 */
import { build } from 'esbuild'
import { mkdir, readdir, rename, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PKG = dirname(dirname(fileURLToPath(import.meta.url)))
const DIST = join(PKG, 'dist')
const STAGE_SUFFIX = '.__stage'

// Same entries the tsup leg bundled: system aliases the atomic entry, and the
// committed E4 primitives roster bundles the authored trio in.
const ENTRIES = {
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

async function buildBundle() {
  const stageDir = `${DIST}${STAGE_SUFFIX}-${process.pid}`
  await rm(stageDir, { recursive: true, force: true })
  try {
    await build({
      absWorkingDir: PKG,
      entryPoints: ENTRIES,
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
      outdir: stageDir,
      outExtension: { '.js': '.mjs' },
      logLevel: 'warning',
    })
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
  for (const file of emitted) {
    const rel = file.slice(stageDir.length + 1)
    const dest = join(DIST, rel)
    await mkdir(dirname(dest), { recursive: true })
    await rename(file, dest)
    console.log(`build-bundle: ${rel}`)
  }
  await rm(stageDir, { recursive: true, force: true })
}

try {
  await buildBundle()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
