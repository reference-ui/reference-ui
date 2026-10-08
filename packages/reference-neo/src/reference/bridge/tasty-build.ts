// Reference tasty build: it takes the phase payload and emits the indexed tasty
// state (manifest, API, diagnostics) for the project sources plus the neo
// style-prop decls. One module-level session caches per source dir; the scan
// root is the project itself because neo keeps no virtual mirror.

import { existsSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { type TastyApi, type TastySymbol } from '@reference-ui/rust/tasty'
import {
  createTastyBuildSession,
  type BuiltTasty,
  type TastyBuildDiagnostic,
} from '@reference-ui/rust/tasty/build'

type BuiltTastyWarnings = BuiltTasty['warnings']
import { getOutDirPath } from '../../lib/paths/index.ts'
import { createReferenceUiTastyApi } from '../tasty/api.ts'
import type { ReferenceTastyPayload } from './types.ts'
import { getReferenceTastyDirPath } from './paths.ts'

/** Rust glob + include patterns use forward slashes. */
function posixRelative(from: string, to: string): string {
  return relative(from, to).split(sep).join('/')
}

export interface ReferenceTastyBuildState {
  sourceDir: string
  outputDir: string
  manifestPath: string
  warnings: BuiltTastyWarnings
  diagnostics: TastyBuildDiagnostic[]
  api: TastyApi
}

export interface ReferenceTastyScanOptions {
  rootDir: string
  include: string[]
}

/** Prunes dependency trees from the follow-links Rust walker (see below). */
const NODE_MODULES_EXCLUDE = '!node_modules/**'

const tastyBuildSession = createTastyBuildSession()

export function getReferenceTastyBuild(
  sourceDir: string
): ReferenceTastyBuildState | undefined {
  const resolvedSourceDir = resolve(sourceDir)
  const built = tastyBuildSession.get(resolvedSourceDir)
  if (!built) return undefined
  return toReferenceTastyBuildState(resolvedSourceDir, built)
}

export async function rebuildReferenceTastyBuild(
  payload: ReferenceTastyPayload
): Promise<ReferenceTastyBuildState> {
  const sourceDir = resolve(payload.sourceDir)
  const outputDir = getReferenceTastyDirPath(sourceDir)
  const builtTasty = await tastyBuildSession.rebuild(sourceDir, {
    ...buildReferenceTastyScanOptions(sourceDir, payload.config.include),
    outputDir,
  })
  return toReferenceTastyBuildState(sourceDir, builtTasty)
}

/**
 * Scan the project in place (neo keeps no virtual mirror) plus the one neo
 * decl root the style-prop projection needs: `style-props.d.ts` alone.
 * `index.d.ts` is deliberately NOT rooted — it declares a top-level
 * `StyleProps` that would index a second entry — while the compiler follows
 * its types through `style-props.d.ts`'s import without indexing them. The
 * existsSync guard keeps a mid-publish outDir from failing the background
 * phase.
 *
 * `node_modules` is pruned by negation: the Rust walker follows symlinks and
 * a single dangling link fails the whole scan, while node_modules matches are
 * dropped from the indexed set anyway — so the exclusion is semantically
 * neutral and strictly safer. Re-export discovery resolves linked packages
 * through node resolution, not the walker, and is unaffected.
 */
export function buildReferenceTastyScanOptions(
  sourceDir: string,
  configInclude: string[]
): ReferenceTastyScanOptions {
  const root = resolve(sourceDir)
  const outDir = getOutDirPath(root)
  const include = [...configInclude]
  if (!include.includes(NODE_MODULES_EXCLUDE)) {
    include.push(NODE_MODULES_EXCLUDE)
  }
  includeExistingTastyRoot(include, root, outDir, 'styled/types/style-props.d.ts')
  return { rootDir: root, include }
}

function includeExistingTastyRoot(
  include: string[],
  rootDir: string,
  outDir: string,
  relativePath: string
): void {
  const filePath = join(outDir, relativePath)
  if (existsSync(filePath)) {
    include.push(posixRelative(rootDir, filePath))
  }
}

export async function loadReferenceSymbol(
  payload: ReferenceTastyPayload,
  name: string
): Promise<{ state: ReferenceTastyBuildState; symbol: TastySymbol }> {
  const state =
    (await maybeGetReadyTastyBuildState(payload)) ??
    (await rebuildReferenceTastyBuild(payload))
  const symbol = await state.api.loadSymbolByName(name)
  return { state, symbol }
}

async function maybeGetReadyTastyBuildState(
  payload: ReferenceTastyPayload
): Promise<ReferenceTastyBuildState | undefined> {
  const sourceDir = resolve(payload.sourceDir)
  const built = await tastyBuildSession.ensureReady(sourceDir)
  if (!built) return undefined
  return toReferenceTastyBuildState(sourceDir, built)
}

function toReferenceTastyBuildState(
  sourceDir: string,
  builtTasty: {
    outputDir: string
    manifestPath: string
    warnings: BuiltTastyWarnings
    diagnostics: TastyBuildDiagnostic[]
    api: TastyApi
  }
): ReferenceTastyBuildState {
  return {
    sourceDir,
    outputDir: builtTasty.outputDir,
    manifestPath: builtTasty.manifestPath,
    warnings: builtTasty.warnings,
    diagnostics: builtTasty.diagnostics,
    api: createReferenceUiTastyApi({ manifestPath: builtTasty.manifestPath }),
  }
}
