// Bundle step for @reference-ui/mcp (BUNDLER_UNIFICATION.md Arc C): raw
// esbuild, ESM-only, no dts/splitting, sourcemaps on. It takes the 4 tsup
// entries and emits staged .mjs outputs, renaming each into dist/ atomically
// so a rebuild during a live dev server never 404s (FINALIZE.md F-2).
// Externals are computed from this package's package.json (dependencies,
// bare and /* subpath forms) — including @rspress/mdx-rs, whose per-platform
// native bindings tsup's native-node-modules plugin choked on (the red-at-HEAD
// cause); the bare specifier survives into dist and resolves from node_modules
// at runtime. The neo-alias and icons-index-text plugins moved here verbatim
// from tsup.config.ts. Run from the package dir:
// node scripts/build-bundle.mjs [--watch]

import { build, context } from 'esbuild'
import { readFile } from 'node:fs/promises'
import { mkdir, readdir, rename, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(dirname(fileURLToPath(import.meta.url)))
const neo = p => resolve(here, '../reference-neo/src', p)
const STAGE_SUFFIX = '.__stage'

// F1 specifier wiring: the virtual `@reference-ui/neo/*` ids resolve to Neo
// source files at build time (mirrors tsconfig paths). Aliased modules bundle
// into dist (F4: shipped installs carry no neo dependency); bare externals
// (esbuild, fast-glob, @reference-ui/rust/*, node builtins) stay external.
/** @type {Record<string, string>} */
const NEO_ALIAS = {
  '@reference-ui/neo/config/store': neo('config/store.ts'),
  '@reference-ui/neo/config/errors': neo('config/errors.ts'),
  '@reference-ui/neo/config/evaluate': neo('config/evaluate.ts'),
  '@reference-ui/neo/config/validate': neo('config/validate.ts'),
  '@reference-ui/neo/config/constants': neo('config/constants.ts'),
  '@reference-ui/neo/config/types': neo('config/types.ts'),
  '@reference-ui/neo/reference': neo('reference/api.ts'),
  '@reference-ui/neo/fragments/runner': neo('collect/lib/runner.ts'),
  '@reference-ui/neo/fragments/scanner': neo('collect/lib/scan/scanner.ts'),
  '@reference-ui/neo/fragments/tokens': neo('collect/surface/tokens.ts'),
  '@reference-ui/neo/microbundle': neo('lib/microbundle/index.ts'),
}

/** @type {import('esbuild').Plugin} */
const neoAlias = {
  name: 'neo-alias',
  setup(pluginBuild) {
    for (const [id, path] of Object.entries(NEO_ALIAS)) {
      const filter = new RegExp(`^${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
      pluginBuild.onResolve({ filter }, () => ({ path }))
    }
  },
}

// Bundle the 5.27MB MiniSearch dump as raw text (single JSON.parse at load)
// instead of an inlined object literal + load-time stringify/reparse. Scoped
// to this one file: every other .json import in the graph keeps its loader.
/** @type {import('esbuild').Plugin} */
const iconsIndexText = {
  name: 'icons-index-text',
  setup(pluginBuild) {
    pluginBuild.onLoad({ filter: /icons-index\.json$/ }, async args => ({
      contents: await readFile(args.path, 'utf8'),
      loader: 'text',
    }))
  },
}

function expandSubpath(spec) {
  // Bare package specs externalize their subpaths too; relative specs and
  // already-wildcarded specs pass through verbatim.
  if (spec.startsWith('.') || spec.endsWith('/*')) return [spec]
  return [spec, `${spec}/*`]
}

async function computeExternals(packageDir) {
  const packageJson = JSON.parse(await readFile(join(packageDir, 'package.json'), 'utf8'))
  return Object.keys({
    ...packageJson.dependencies,
    ...packageJson.peerDependencies,
    ...packageJson.optionalDependencies,
  }).flatMap(expandSubpath)
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

async function renameStaged(stageDir, distDir) {
  // Staged write: every output lands in dist/ via atomic rename, so
  // dist/*.mjs always exists — no clean-then-rewrite 404 window.
  const emitted = await stageFiles(stageDir)
  if (emitted.length === 0) throw new Error('build-bundle: esbuild emitted no files')
  await mkdir(distDir, { recursive: true })
  for (const file of emitted) {
    const rel = file.slice(stageDir.length + 1)
    const dest = join(distDir, rel)
    await mkdir(dirname(dest), { recursive: true })
    await rename(file, dest)
    console.log(`build-bundle: ${rel}`)
  }
  return emitted.length
}

async function main() {
  const root = here
  const watch = process.argv.includes('--watch')
  const distDir = join(root, 'dist')
  const stageDir = `${distDir}${STAGE_SUFFIX}-${process.pid}`
  const external = await computeExternals(root)

  // Re-stage after every build (one-shot and each watch rebuild): files move
  // out of the stage dir, so rebuilds always land on an empty stage.
  /** @type {import('esbuild').Plugin} */
  const stageRename = {
    name: 'stage-rename',
    setup(pluginBuild) {
      pluginBuild.onEnd(async result => {
        if (result.errors.length > 0) return
        await renameStaged(stageDir, distDir)
      })
    },
  }

  /** @type {import('esbuild').BuildOptions} */
  const options = {
    absWorkingDir: root,
    entryPoints: {
      index: 'src/index.ts',
      cli: 'src/cli/index.ts',
      'mcp-child': 'src/child-process/entry.ts',
      // Neo author entry as a real file: mcp-side esbuild alias maps (ui.config
      // bundling, token-fragment bundling) point at this artifact at runtime.
      'neo-author': '../reference-neo/src/index.ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    // No `jsx` option on purpose: the tsconfig `jsx` field wins over the API
    // value, so react-jsx/automatic applies (verified moot here anyway — the
    // bundle graph carries no real JSX, only an externals-regex literal).
    splitting: false,
    sourcemap: true,
    minify: false,
    treeShaking: true,
    // Fidelity knobs replicating tsup's effective set: keepNames was forced by
    // tsup's SWC pass (__name wrappers in the last-good dist), mainFields is
    // tsup's node default, legalComments 'none' matches tsup emitting no
    // license text (mirrors Arc A's findings).
    keepNames: true,
    mainFields: ['module', 'main'],
    legalComments: 'none',
    tsconfig: join(root, 'tsconfig.json'),
    plugins: [neoAlias, iconsIndexText, stageRename],
    external,
    outdir: stageDir,
    outExtension: { '.js': '.mjs' },
    logLevel: 'warning',
  }

  await rm(stageDir, { recursive: true, force: true })
  if (watch) {
    const ctx = await context(options)
    await ctx.watch()
    console.log('build-bundle: watching for changes; Ctrl-C to stop')
    const shutdown = async () => {
      await ctx.dispose()
      await rm(stageDir, { recursive: true, force: true })
      process.exit(0)
    }
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
    await new Promise(() => {})
  } else {
    try {
      await build(options)
    } finally {
      await rm(stageDir, { recursive: true, force: true })
    }
  }
}

try {
  await main()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
