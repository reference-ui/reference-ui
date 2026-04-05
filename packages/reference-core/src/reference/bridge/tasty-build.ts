import { existsSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { type TastyApi, type TastySymbol } from '@reference-ui/rust/tasty'
import {
  createTastyBuildSession,
  type TastyBuildDiagnostic,
} from '@reference-ui/rust/tasty/build'
import { getOutDirPath, getVirtualDirPath } from '../../lib/paths'
import { createReferenceUiTastyApi } from '../tasty/api'
import type { ReferenceWorkerPayload } from './worker-types'
import { getReferenceTastyDirPath } from './paths'

/** Rust glob + include patterns use forward slashes. */
function posixRelative(from: string, to: string): string {
  return relative(from, to).split(sep).join('/')
}

export interface ReferenceTastyBuildState {
  sourceDir: string
  virtualDir: string
  outputDir: string
  manifestPath: string
  warnings: string[]
  diagnostics: TastyBuildDiagnostic[]
  api: TastyApi
}

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
  payload: ReferenceWorkerPayload
): Promise<ReferenceTastyBuildState> {
  const sourceDir = resolve(payload.sourceDir)
  const outputDir = getReferenceTastyDirPath(sourceDir)
  const builtTasty = await tastyBuildSession.rebuild(sourceDir, {
    ...buildTastyScanOptions(sourceDir, payload.config.include),
    outputDir,
  })
  return toReferenceTastyBuildState(sourceDir, builtTasty)
}

/**
 * Scan under `.reference-ui/` only (not the package root) so the Rust glob
 * walker does not traverse `node_modules` (`follow_links` can hit broken
 * symlinks there).
 *
 * Panda's `style-props.d.ts` exports `SystemProperties`, which StrictColorProps /
 * SystemStyleObject need for `P` when projecting StyleProps. We include that
 * file alone to avoid duplicate symbol entries from scanning the full styled
 * tree (react/types/user overlaps).
 */
function buildTastyScanOptions(
  sourceDir: string,
  configInclude: string[]
): {
  rootDir: string
  include: string[]
} {
  const root = resolve(sourceDir)
  const virtualDir = getVirtualDirPath(root)
  const outDir = getOutDirPath(root)
  const include = configInclude.map(pattern =>
    posixRelative(outDir, join(virtualDir, pattern))
  )
  const stylePropsDts = join(outDir, 'styled', 'types', 'style-props.d.ts')
  if (existsSync(stylePropsDts)) {
    include.push(posixRelative(outDir, stylePropsDts))
  }
  return { rootDir: outDir, include }
}

export async function loadReferenceSymbol(
  payload: ReferenceWorkerPayload,
  name: string
): Promise<{ state: ReferenceTastyBuildState; symbol: TastySymbol }> {
  const state =
    (await maybeGetReadyTastyBuildState(payload)) ??
    (await rebuildReferenceTastyBuild(payload))
  const symbol = await state.api.loadSymbolByName(name)
  return { state, symbol }
}

async function maybeGetReadyTastyBuildState(
  payload: ReferenceWorkerPayload
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
    warnings: string[]
    diagnostics: TastyBuildDiagnostic[]
    api: TastyApi
  }
): ReferenceTastyBuildState {
  return {
    sourceDir,
    virtualDir: getVirtualDirPath(sourceDir),
    outputDir: builtTasty.outputDir,
    manifestPath: builtTasty.manifestPath,
    warnings: builtTasty.warnings,
    diagnostics: builtTasty.diagnostics,
    api: createReferenceUiTastyApi({ manifestPath: builtTasty.manifestPath }),
  }
}
