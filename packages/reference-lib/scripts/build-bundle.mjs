// Shared bundle step for @reference-ui/lib and the 8 matrix fixtures
// (BUNDLER_UNIFICATION.md Arc A): raw esbuild, ESM-only, no dts/splitting.
// It takes a package dir + entries and emits staged .mjs outputs, renaming
// each into dist/ atomically so a rebuild during a live dev server never
// 404s (FINALIZE.md F-2). Externals are computed from the consumer's own
// package.json (dependencies + peerDependencies, bare and /* subpath forms)
// plus explicit extras; devDependencies always bundle. Run from the package
// dir: node scripts/build-bundle.mjs --entry index=src/index.ts
// (--extra-external/--inline repeat; lib passes its react-dom, runtime, and
// tasty edges plus --inline gsap).

import { build } from 'esbuild'
import { mkdir, readFile, readdir, rename, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const STAGE_SUFFIX = '.__stage'

function expandSubpath(spec) {
  // Bare package specs externalize their subpaths too (react covers
  // react/jsx-runtime, zustand covers zustand/vanilla); relative specs and
  // already-wildcarded specs pass through verbatim.
  if (spec.startsWith('.') || spec.endsWith('/*')) return [spec]
  return [spec, `${spec}/*`]
}

export function computeExternals({ packageJson, inline = [], extra = [] }) {
  const inlineSet = new Set(inline.flatMap(expandSubpath))
  const fromManifest = Object.keys({
    ...packageJson.dependencies,
    ...packageJson.peerDependencies,
    ...packageJson.optionalDependencies,
  }).flatMap(expandSubpath)
  const fromExtra = extra.flatMap(expandSubpath)
  return [...fromManifest, ...fromExtra].filter(spec => !inlineSet.has(spec))
}

async function stageFiles(dir) {
  const found = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...(await stageFiles(full)))
    else found.push(full)
  }
  return found
}

export async function buildBundle({
  packageDir = process.cwd(),
  entries,
  extraExternals = [],
  inline = [],
  outDir = 'dist',
} = {}) {
  const root = resolve(packageDir)
  if (!entries || Object.keys(entries).length === 0) {
    throw new Error('build-bundle: at least one --entry name=path is required')
  }
  const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
  const external = computeExternals({ packageJson, inline, extra: extraExternals })
  const distDir = join(root, outDir)
  const stageDir = `${distDir}${STAGE_SUFFIX}-${process.pid}`

  await rm(stageDir, { recursive: true, force: true })
  try {
    await build({
      absWorkingDir: root,
      entryPoints: entries,
      bundle: true,
      format: 'esm',
      platform: 'node',
      target: 'node18',
      // No `jsx` option on purpose: the tsconfig `jsx` field wins over the
      // API value (verified: identical bytes with and without jsx=transform),
      // so react-jsx/automatic applies everywhere, as the Oracle's TSUP-2
      // model assumes. (tsup forced classic only via its SWC plugin, which
      // activated on the base tsconfig's emitDecoratorMetadata — an accident
      // nothing in the bundle graph needs. See the mission log.)
      splitting: false,
      sourcemap: false,
      minify: false,
      treeShaking: true,
      keepNames: true,
      mainFields: ['module', 'main'],
      legalComments: 'none',
      tsconfig: join(root, 'tsconfig.json'),
      external,
      outdir: stageDir,
      outExtension: { '.js': '.mjs' },
      logLevel: 'warning',
    })
  } catch (error) {
    await rm(stageDir, { recursive: true, force: true })
    throw error
  }

  // Staged write: every output lands in dist/ via atomic rename, so
  // dist/index.mjs always exists — no clean-then-rewrite 404 window.
  const emitted = await stageFiles(stageDir)
  if (emitted.length === 0) {
    await rm(stageDir, { recursive: true, force: true })
    throw new Error('build-bundle: esbuild emitted no files')
  }
  await mkdir(distDir, { recursive: true })
  for (const file of emitted) {
    const rel = file.slice(stageDir.length + 1)
    const dest = join(distDir, rel)
    await mkdir(dirname(dest), { recursive: true })
    await rename(file, dest)
    console.log(`build-bundle: ${rel}`)
  }
  await rm(stageDir, { recursive: true, force: true })
  return emitted.length
}

function parseArgs(argv) {
  const entries = {}
  const extraExternals = []
  const inline = []
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--entry') {
      const pair = argv[(i += 1)] ?? ''
      const eq = pair.indexOf('=')
      if (eq === -1) throw new Error(`build-bundle: bad --entry ${pair}`)
      entries[pair.slice(0, eq)] = pair.slice(eq + 1)
    } else if (arg === '--extra-external') {
      extraExternals.push(argv[(i += 1)])
    } else if (arg === '--inline') {
      inline.push(argv[(i += 1)])
    } else {
      throw new Error(`build-bundle: unknown arg ${arg}`)
    }
  }
  return { entries, extraExternals, inline }
}

const invokedDirectly = resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)

if (invokedDirectly) {
  try {
    await buildBundle(parseArgs(process.argv.slice(2)))
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
