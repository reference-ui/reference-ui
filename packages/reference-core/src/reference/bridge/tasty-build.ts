import { resolve } from 'node:path'
import { type TastyApi, type TastySymbol } from '@reference-ui/rust/tasty'
import { createTastyBuildSession, type TastyBuildDiagnostic } from '@reference-ui/rust/tasty/build'
import { getVirtualDirPath } from '../../lib/paths'
import type { ReferenceWorkerPayload } from './worker-types'
import { getReferenceTastyDirPath } from './paths'

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

export function getReferenceTastyBuild(sourceDir: string): ReferenceTastyBuildState | undefined {
  const resolvedSourceDir = resolve(sourceDir)
  const built = tastyBuildSession.get(resolvedSourceDir)
  if (!built) return undefined
  return toReferenceTastyBuildState(resolvedSourceDir, built)
}

export async function rebuildReferenceTastyBuild(
  payload: ReferenceWorkerPayload
): Promise<ReferenceTastyBuildState> {
  const sourceDir = resolve(payload.sourceDir)
  const virtualDir = getVirtualDirPath(sourceDir)
  const outputDir = getReferenceTastyDirPath(sourceDir)
  const builtTasty = await tastyBuildSession.rebuild(sourceDir, {
    rootDir: virtualDir,
    include: payload.config.include,
    outputDir,
  })
  return toReferenceTastyBuildState(sourceDir, builtTasty)
}

export async function loadReferenceSymbol(
  payload: ReferenceWorkerPayload,
  name: string
): Promise<{ state: ReferenceTastyBuildState; symbol: TastySymbol }> {
  const state = (await maybeGetReadyTastyBuildState(payload)) ?? (await rebuildReferenceTastyBuild(payload))
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
    api: builtTasty.api,
  }
}
