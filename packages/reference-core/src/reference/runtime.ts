import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { scanAndEmitModules } from '@reference-ui/rust'
import { createTastyApi, type TastyApi, type TastySymbol } from '@reference-ui/rust/tasty'
import { getVirtualDirPath } from '../lib/paths'
import type { ReferenceWorkerPayload } from './worker-types'
import { getReferenceTastyDirPath } from './paths'

interface EmittedModulesPayload {
  entrypoint: string
  modules: Record<string, string>
  type_declarations: Record<string, string>
}

export interface ReferenceRuntimeState {
  sourceDir: string
  virtualDir: string
  outputDir: string
  manifestPath: string
  api: TastyApi
}

const runtimeBySourceDir = new Map<string, ReferenceRuntimeState>()

export function getReferenceRuntime(sourceDir: string): ReferenceRuntimeState | undefined {
  return runtimeBySourceDir.get(resolve(sourceDir))
}

export async function rebuildReferenceRuntime(
  payload: ReferenceWorkerPayload
): Promise<ReferenceRuntimeState> {
  const sourceDir = resolve(payload.sourceDir)
  const virtualDir = getVirtualDirPath(sourceDir)
  const outputDir = getReferenceTastyDirPath(sourceDir)
  const emitted = parseEmittedPayload(scanAndEmitModules(virtualDir, payload.config.include))

  await writeEmittedArtifacts(outputDir, emitted)

  const manifestPath = resolveManifestPath(outputDir, emitted)
  const api = createTastyApi({ manifestPath })
  await api.ready()

  const state: ReferenceRuntimeState = {
    sourceDir,
    virtualDir,
    outputDir,
    manifestPath,
    api,
  }

  runtimeBySourceDir.set(sourceDir, state)
  return state
}

export async function loadReferenceSymbol(
  payload: ReferenceWorkerPayload,
  name: string
): Promise<{ state: ReferenceRuntimeState; symbol: TastySymbol }> {
  const state = (await maybeGetReadyState(payload)) ?? (await rebuildReferenceRuntime(payload))
  const symbol = await state.api.loadSymbolByName(name)
  return { state, symbol }
}

async function maybeGetReadyState(
  payload: ReferenceWorkerPayload
): Promise<ReferenceRuntimeState | undefined> {
  const state = getReferenceRuntime(payload.sourceDir)
  if (!state) return undefined
  await state.api.ready()
  return state
}

async function writeEmittedArtifacts(
  outputDir: string,
  emitted: EmittedModulesPayload
): Promise<void> {
  await rm(outputDir, { recursive: true, force: true })

  const files = {
    ...emitted.modules,
    ...emitted.type_declarations,
  }

  await Promise.all(
    Object.entries(files).map(async ([relativePath, source]) => {
      const outputPath = join(outputDir, stripRelativePrefix(relativePath))
      await mkdir(dirname(outputPath), { recursive: true })
      await writeFile(outputPath, source.endsWith('\n') ? source : `${source}\n`, 'utf-8')
    })
  )
}

function stripRelativePrefix(relativePath: string): string {
  return relativePath.replace(/^\.\//, '')
}

function parseEmittedPayload(raw: string): EmittedModulesPayload {
  const parsed = JSON.parse(raw) as Partial<EmittedModulesPayload>
  if (
    typeof parsed.entrypoint !== 'string' ||
    parsed.modules == null ||
    typeof parsed.modules !== 'object' ||
    parsed.type_declarations == null ||
    typeof parsed.type_declarations !== 'object'
  ) {
    throw new Error('Malformed emitted Tasty modules payload.')
  }
  return parsed as EmittedModulesPayload
}

function resolveManifestPath(outputDir: string, emitted: EmittedModulesPayload): string {
  const manifestModulePath = Object.keys(emitted.modules).find((path) => path.endsWith('/manifest.js'))
    ?? Object.keys(emitted.modules).find((path) => path === './manifest.js')

  if (!manifestModulePath) {
    throw new Error('Emitted Tasty modules payload did not include ./manifest.js.')
  }

  return join(outputDir, stripRelativePrefix(manifestModulePath))
}
