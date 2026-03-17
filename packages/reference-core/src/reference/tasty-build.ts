import { resolve } from 'node:path'
import { type TastyApi, type TastySymbol } from '@reference-ui/rust/tasty'
import { buildTasty } from '@reference-ui/rust/tasty/build'
import { getVirtualDirPath } from '../lib/paths'
import type { ReferenceWorkerPayload } from './worker-types'
import { getReferenceTastyDirPath } from './paths'

export interface ReferenceTastyBuildState {
  sourceDir: string
  virtualDir: string
  outputDir: string
  manifestPath: string
  warnings: string[]
  api: TastyApi
}

const tastyBuildBySourceDir = new Map<string, ReferenceTastyBuildState>()

export function getReferenceTastyBuild(sourceDir: string): ReferenceTastyBuildState | undefined {
  return tastyBuildBySourceDir.get(resolve(sourceDir))
}

export async function rebuildReferenceTastyBuild(
  payload: ReferenceWorkerPayload
): Promise<ReferenceTastyBuildState> {
  const sourceDir = resolve(payload.sourceDir)
  const virtualDir = getVirtualDirPath(sourceDir)
  const outputDir = getReferenceTastyDirPath(sourceDir)
  const builtTasty = await buildTasty({
    rootDir: virtualDir,
    include: payload.config.include,
    outputDir,
  })

  const state: ReferenceTastyBuildState = {
    sourceDir,
    virtualDir,
    outputDir: builtTasty.outputDir,
    manifestPath: builtTasty.manifestPath,
    warnings: builtTasty.warnings,
    api: builtTasty.api,
  }

  tastyBuildBySourceDir.set(sourceDir, state)
  return state
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
  const state = getReferenceTastyBuild(payload.sourceDir)
  if (!state) return undefined
  await state.api.ready()
  return state
}
