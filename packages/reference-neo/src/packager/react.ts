// React entry publishing for the Neo generated folder.
// It takes the system name plus compiled style prop names and emits the
// react package: a minified bundled react.mjs plus its external map and standalone react.d.mts. React
// stays external (like core's entry): bundling it would fork the dispatcher
// for any consumer rendering through its own react-dom, so the bundle
// imports 'react' and the consumer provides the copy. No react-dom edge:
// consumers bring their own copy, and packages built on the entry import
// clean where react-dom is absent (core contract).
// css()/recipe() bundle in pre-registered over this system's runtime-data
// (D4: styled stays data-only).
// The synced stage sits one level deeper than the live folder the commit
// renames it into, so the linked map's sources are emitted relative to the
// live folder while the bytes still land in the stage (F-A): every source
// must resolve after the commit, or devtools and IDEs read the wrong file.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type * as esbuild from 'esbuild'
import { microBundleWithResult } from '../lib/microbundle/index.ts'
import {
  generateReactEntrySource,
  generateReactTypesSource,
} from '../primitives/generate/generate.ts'
import { REACT_BUNDLE_EXTERNALS } from './externals.ts'

export interface ReactPublishInput {
  /** Stage folder the emitted bytes land in (react.mjs and its map). */
  outDir: string
  /**
   * Live folder the stage commits into; map sources are emitted relative to
   * it so they resolve after the commit rename. Defaults to `outDir` (scratch
   * callers that never stage).
   */
  liveOutDir?: string
  systemName: string
  stylePropNames: string[]
  /** Raw spec recipes: stems the bound types variant union (never when absent). */
  recipes: Record<string, unknown>
}

function runtimeModulePath(...parts: string[]): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..', ...parts)
}

function primitivesModulePath(): string {
  // The E2 primitives surface, live from the workspace package (never
  // copied, never tree-relative: no relative hop survives src vs dist vs
  // packed depths and the packed tree has no reference-rs). The exports map
  // is the contract, so this resolves through it — workspace src/dist via
  // the node_modules link, packed installs via the registry tarball.
  return fileURLToPath(import.meta.resolve('@reference-ui/rust/primitives'))
}

function runtimeHeaderSource(dataPath: string): string {
  return [
    `import { css, recipe, registerRecipeData, registerRuntimeData } from ${JSON.stringify(runtimeModulePath('runtime', 'index.ts'))}`,
    `import { runtimeData, systemName } from ${JSON.stringify(dataPath)}`,
    'registerRuntimeData(systemName, runtimeData)',
    'registerRecipeData(systemName, runtimeData.recipes, runtimeData.responsiveBreakpoints)',
    'export { css, recipe }',
    '',
  ].join('\n')
}

/** esbuild loaders for the staged inputs the live-map plugin re-homes. */
const STAGED_LOADERS: Record<string, esbuild.Loader> = {
  '.mts': 'ts',
  '.ts': 'ts',
  '.tsx': 'tsx',
  '.mjs': 'js',
  '.js': 'js',
}

/** Forward-slash form of a path so a `/`-presented stage path matches a
 * `\`-joined prefix and vice versa (B3D-P3-2). */
function toForwardSlashes(value: string): string {
  return value.replace(/\\/g, '/')
}

/**
 * True when `path` sits under `stageDir`, comparing separator-insensitively so
 * a `/`-presented plugin path still matches on Win32 and never silently
 * no-ops the re-home (B3D-P3-2); `stageDir` itself counts as under. Exported
 * for the separator unit test.
 */
export function isStagedPath(stageDir: string, path: string): boolean {
  const stage = toForwardSlashes(stageDir)
  const normalized = toForwardSlashes(path)
  return normalized === stage || normalized.startsWith(`${stage}/`)
}

/**
 * Loader for a staged input by extension. An unknown extension throws instead
 * of silently loading as `js` (B3D-P4-1); live inputs are `.mts`/`.mjs` only,
 * so this is defensive. Exported for the unit test.
 */
export function stagedLoaderFor(stagedPath: string): esbuild.Loader {
  const ext = extname(stagedPath)
  const loader = STAGED_LOADERS[ext]
  if (loader === undefined) {
    throw new Error(
      `neo-live-map-paths: no staged loader for ${stagedPath} (extension "${ext}")`
    )
  }
  return loader
}

/**
 * Re-home staged bundle inputs at their eventual live paths (F-A). Esbuild
 * derives the linked map's `sources` from each input's path relative to
 * `outfile`; the entry and runtime data live under the stage, one level
 * deeper than the live folder, so a live `outfile` base would orphan every
 * source it owns by one `../`. Reporting each staged input at its live twin
 * makes the shipped map resolve while the bytes stay staged. Only used when
 * the stage and live folders differ. Exported for the relative-import test.
 */
export function liveMapPathPlugin(stageDir: string, liveDir: string): esbuild.Plugin {
  const stagedByLivePath = new Map<string, string>()
  const toLive = (path: string): string | undefined => {
    if (!isStagedPath(stageDir, path)) return undefined
    return join(liveDir, relative(stageDir, path))
  }
  return {
    name: 'neo-live-map-paths',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        // A relative specifier is joined against the importer's dir before the
        // stage test, or a staged relative import never re-homes (B3D-P3-1).
        // Absolute specifiers pass through unchanged.
        const staged = args.path.startsWith('.')
          ? resolve(args.resolveDir, args.path)
          : args.path
        const live = toLive(staged)
        if (live === undefined) return undefined
        stagedByLivePath.set(live, staged)
        return { path: live }
      })
      build.onLoad({ filter: /.*/ }, (args) => {
        const staged = stagedByLivePath.get(args.path)
        if (staged === undefined) return undefined
        return {
          contents: readFileSync(staged, 'utf-8'),
          loader: stagedLoaderFor(staged),
          resolveDir: dirname(staged),
        }
      })
    },
  }
}

/**
 * Publish the generated react package: bundle the bound entry (the live
 * E2 roster bound per system, with css()/recipe() pre-registered over
 * this system's data) and write the standalone types. The shell already
 * wrote the final manifest plus the styles.css copy; this leg only adds
 * the bundle. The map is emitted live-relative while react.mjs and its
 * map stay in the stage folder the commit renames live.
 */
export async function publishReactBundle(input: ReactPublishInput): Promise<void> {
  const stageDir = input.outDir
  const liveDir = input.liveOutDir ?? input.outDir
  const dir = join(stageDir, 'react')
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, 'react.d.mts'),
    generateReactTypesSource({ stylePropNames: input.stylePropNames, recipes: input.recipes }),
    'utf-8'
  )

  // Stable entry path under the output tmp dir: esbuild stamps the entry path
  // into the bundle as a module comment, so a random scratch name would make
  // consecutive syncs differ by bytes (SYNC-06). Scoped per output dir, so
  // concurrent syncs of different projects never share it.
  const entryPath = join(stageDir, 'tmp', 'react-entry.mts')
  mkdirSync(join(stageDir, 'tmp'), { recursive: true })
  try {
    writeFileSync(
      entryPath,
      runtimeHeaderSource(join(stageDir, 'styled', 'runtime-data.mjs')) +
        generateReactEntrySource({
          systemName: input.systemName,
          stylePropNames: input.stylePropNames,
          primitivesPath: primitivesModulePath(),
        }),
      'utf-8'
    )
    const bundle = await microBundleWithResult(entryPath, {
      format: 'esm',
      platform: 'browser',
      // React rides with the consumer (see header): external, never bundled.
      external: REACT_BUNDLE_EXTERNALS,
      // Minified with an external map: the shipped bundle holds its size
      // bound while the map keeps it debuggable. Names mangle, so the miss
      // call-site probe keeps only the react.mjs file marker (by design).
      minify: true,
      keepNames: false,
      sourcemap: 'linked',
      // Live base: the map's external sources resolve one `../` shallower.
      outfile: join(liveDir, 'react', 'react.mjs'),
      ...(liveDir === stageDir ? {} : { plugins: [liveMapPathPlugin(stageDir, liveDir)] }),
    })
    writeFileSync(join(dir, 'react.mjs'), bundle.code, 'utf-8')
    if (bundle.map !== undefined) {
      writeFileSync(join(dir, 'react.mjs.map'), bundle.map, 'utf-8')
    }
  } finally {
    rmSync(entryPath, { force: true })
  }
}
