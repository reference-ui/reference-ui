// Bundle step for @reference-ui/icons (docs/archive/BUNDLER_UNIFICATION.md Arc B): raw
// esbuild multi-entry replacing rollup preserveModules. Entries mirror
// rollup.config.mjs exactly (index + createIcon + constants + every file in
// src/generated); outbase 'src' reproduces the mirrored dist layout with
// .mjs out-extension. Externals are marked up front — including the
// @material-symbols-svg/react subpath form — so nothing resolves that would
// need rewriting (no resolve-then-rewrite). Output assembles in a stage dir
// and renames into dist/ file-by-file (docs/FINALIZE.md F-2 shape, as Arc A).
// Run from the package dir: node scripts/build-bundle.mjs

import { build } from 'esbuild'
import { existsSync, readdirSync } from 'node:fs'
import { mkdir, readFile, readdir, rename, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(packageRoot, 'dist')
const stageDir = `${distDir}.__stage-${process.pid}`

function toPosix(value) {
  return value.replaceAll('\\', '/')
}

// preserveModules semantics: a relative import that resolves to another
// entry stays an import (with the .mjs out-extension) instead of being
// bundled. Without this, splitting on evacuates every barrel-reachable
// entry body into hashed chunks (entry stubs; materialize's createIcon.mjs
// rewrite goes silent while the bare @reference-ui/react ships in a
// chunk), and splitting off duplicates createIcon into all 3857 generated
// files (same bare-specifier leak, +2KB each). Verified both failure
// modes 2026-10-08 before adding the plugin.
function entryImportsAsExternal(entrySrcSet) {
  return {
    name: 'entry-imports-external',
    setup(esbuild) {
      esbuild.onResolve({ filter: /^\.\.?\// }, args => {
        if (!args.importer) return null
        const fromDir = dirname(toPosix(args.importer))
        const resolved = toPosix(join(fromDir, args.path))
        const rootPrefix = `${toPosix(packageRoot)}/`
        const rel = resolved.startsWith(rootPrefix)
          ? resolved.slice(rootPrefix.length)
          : null
        const hit =
          rel !== null &&
          [rel, `${rel}.ts`, `${rel}.tsx`].find(candidate => entrySrcSet.has(candidate))
        if (!hit) return null
        const outRel = args.path.endsWith('.mjs')
          ? args.path
          : `${args.path.replace(/\.(ts|tsx)$/, '')}.mjs`
        return { path: outRel, external: true }
      })
    },
  }
}

// Extra externals beyond the manifest (react, @material-symbols-svg/react):
// parity with the rollup externalPackageRoots. Unused patterns are harmless.
const extraExternals = ['react-dom', '@reference-ui/react', '@reference-ui/system']

function expandSubpath(spec) {
  // Bare specs externalize their subpaths too (@material-symbols-svg/react
  // covers @material-symbols-svg/react/icons/<slug>); relative specs and
  // already-wildcarded specs pass through verbatim.
  if (spec.startsWith('.') || spec.endsWith('/*')) return [spec]
  return [spec, `${spec}/*`]
}

function externalFromManifest(packageJson) {
  return Object.keys({
    ...packageJson.dependencies,
    ...packageJson.peerDependencies,
    ...packageJson.optionalDependencies,
  }).flatMap(expandSubpath)
}

function generatedEntries() {
  const generatedDir = join(packageRoot, 'src', 'generated')
  if (!existsSync(generatedDir)) return []

  const entries = []
  for (const fileName of readdirSync(generatedDir)) {
    if (!fileName.endsWith('.tsx') && fileName !== 'index.ts') continue
    entries.push(join('src', 'generated', fileName))
  }
  return entries.sort()
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

const packageJson = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'))
const entryPoints = [
  join('src', 'index.ts'),
  join('src', 'createIcon.tsx'),
  join('src', 'constants.ts'),
  ...generatedEntries(),
]
const entrySrcSet = new Set(entryPoints.map(entry => toPosix(entry)))

await rm(stageDir, { recursive: true, force: true })
try {
  await build({
    absWorkingDir: packageRoot,
    entryPoints,
    bundle: true,
    format: 'esm',
    target: 'es2020',
    jsx: 'automatic',
    splitting: true,
    plugins: [entryImportsAsExternal(entrySrcSet)],
    sourcemap: false,
    minify: false,
    treeShaking: true,
    legalComments: 'none',
    tsconfig: join(packageRoot, 'tsconfig.json'),
    external: [
      ...externalFromManifest(packageJson),
      ...extraExternals.flatMap(expandSubpath),
    ],
    outdir: stageDir,
    outbase: join(packageRoot, 'src'),
    outExtension: { '.js': '.mjs' },
    logLevel: 'warning',
  })
} catch (error) {
  await rm(stageDir, { recursive: true, force: true })
  throw error
}

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
}
await rm(stageDir, { recursive: true, force: true })
console.error(`reference-icons: bundled ${emitted.length} files`)
