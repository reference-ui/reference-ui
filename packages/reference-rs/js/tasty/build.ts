import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'

import { scanAndEmitModules } from '../runtime/index'
import { createTastyApi, type TastyApi } from './index'

interface EmittedModulesPayload {
  modules: Record<string, string>
  type_declarations: Record<string, string>
  diagnostics?: RawScannerDiagnostic[]
}

interface RawScannerDiagnostic {
  file_id: string
  message: string
}

export interface TastyBuildDiagnostic {
  level: 'warning'
  source: 'scanner' | 'manifest'
  message: string
  fileId?: string
}

export interface BuildTastyOptions {
  rootDir: string
  include: string[]
  outputDir: string
}

export interface BuiltTasty {
  rootDir: string
  outputDir: string
  manifestPath: string
  warnings: string[]
  diagnostics: TastyBuildDiagnostic[]
  api: TastyApi
}

export interface TastyBuildSession {
  get(key: string): BuiltTasty | undefined
  ensureReady(key: string): Promise<BuiltTasty | undefined>
  rebuild(key: string, options: BuildTastyOptions): Promise<BuiltTasty>
  getOrRebuild(key: string, options: BuildTastyOptions): Promise<BuiltTasty>
}

export async function buildTasty(options: BuildTastyOptions): Promise<BuiltTasty> {
  const rootDir = resolve(options.rootDir)
  const outputDir = resolve(options.outputDir)
  const emitted = parseEmittedPayload(scanAndEmitModules(rootDir, options.include))

  await writeEmittedArtifacts(outputDir, emitted)

  const manifestPath = resolveManifestPath(outputDir, emitted)
  const api = createTastyApi({ manifestPath })
  await api.ready()
  const warnings = api.getWarnings()
  const scannerDiagnostics = normalizeScannerDiagnostics(emitted.diagnostics)
  const scannerWarningTexts = new Set(scannerDiagnostics.map(formatScannerWarning))
  const manifestDiagnostics = warnings
    .filter((warning) => !scannerWarningTexts.has(warning))
    .map((warning) => ({
      level: 'warning' as const,
      source: 'manifest' as const,
      message: warning,
    }))

  return {
    rootDir,
    outputDir,
    manifestPath,
    warnings,
    diagnostics: [...scannerDiagnostics, ...manifestDiagnostics],
    api,
  }
}

export function createTastyBuildSession(): TastyBuildSession {
  return new TastyBuildSessionImpl()
}

class TastyBuildSessionImpl implements TastyBuildSession {
  private readonly buildsByKey = new Map<string, BuiltTasty>()
  private readonly rebuildsByKey = new Map<string, Promise<BuiltTasty>>()

  get(key: string): BuiltTasty | undefined {
    return this.buildsByKey.get(key)
  }

  async ensureReady(key: string): Promise<BuiltTasty | undefined> {
    const cached = this.buildsByKey.get(key)
    if (!cached) return undefined
    await cached.api.ready()
    return cached
  }

  async rebuild(key: string, options: BuildTastyOptions): Promise<BuiltTasty> {
    const existing = this.rebuildsByKey.get(key)
    if (existing) return existing

    const rebuild = buildTasty(options)
      .then((built) => {
        this.buildsByKey.set(key, built)
        return built
      })
      .finally(() => {
        this.rebuildsByKey.delete(key)
      })

    this.rebuildsByKey.set(key, rebuild)
    return rebuild
  }

  async getOrRebuild(key: string, options: BuildTastyOptions): Promise<BuiltTasty> {
    return (await this.ensureReady(key)) ?? (await this.rebuild(key, options))
  }
}

function parseEmittedPayload(raw: string): EmittedModulesPayload {
  const parsed = JSON.parse(raw) as Partial<EmittedModulesPayload>
  if (
    parsed.modules == null ||
    typeof parsed.modules !== 'object' ||
    parsed.type_declarations == null ||
    typeof parsed.type_declarations !== 'object' ||
    (parsed.diagnostics != null && !isRawScannerDiagnostics(parsed.diagnostics))
  ) {
    throw new Error('Malformed emitted Tasty modules payload.')
  }
  return {
    modules: parsed.modules as Record<string, string>,
    type_declarations: parsed.type_declarations as Record<string, string>,
    diagnostics: parsed.diagnostics ?? [],
  }
}

function isRawScannerDiagnostics(value: unknown): value is RawScannerDiagnostic[] {
  return Array.isArray(value) && value.every((entry) =>
    entry != null &&
    typeof entry === 'object' &&
    'file_id' in entry &&
    typeof entry.file_id === 'string' &&
    'message' in entry &&
    typeof entry.message === 'string'
  )
}

function normalizeScannerDiagnostics(
  diagnostics: RawScannerDiagnostic[] | undefined
): TastyBuildDiagnostic[] {
  return (diagnostics ?? []).map((diagnostic) => ({
    level: 'warning',
    source: 'scanner',
    fileId: diagnostic.file_id,
    message: diagnostic.message,
  }))
}

function formatScannerWarning(diagnostic: TastyBuildDiagnostic): string {
  return diagnostic.fileId ? `${diagnostic.fileId}: ${diagnostic.message}` : diagnostic.message
}

async function writeEmittedArtifacts(
  outputDir: string,
  emitted: EmittedModulesPayload
): Promise<void> {
  await mkdir(dirname(outputDir), { recursive: true })

  const tempDir = await mkdtemp(join(dirname(outputDir), `${basename(outputDir)}.tmp-`))

  try {
    const files = {
      ...emitted.modules,
      ...emitted.type_declarations,
    }

    await Promise.all(
      Object.entries(files).map(async ([relativePath, source]) => {
        const outputPath = join(tempDir, stripRelativePrefix(relativePath))
        await mkdir(dirname(outputPath), { recursive: true })
        await writeFile(outputPath, source.endsWith('\n') ? source : `${source}\n`, 'utf-8')
      })
    )

    await rm(outputDir, { recursive: true, force: true })
    await rename(tempDir, outputDir)
  } catch (error) {
    await rm(tempDir, { recursive: true, force: true })
    throw error
  }
}

function stripRelativePrefix(relativePath: string): string {
  return relativePath.replace(/^\.\//, '')
}

function resolveManifestPath(outputDir: string, emitted: EmittedModulesPayload): string {
  const manifestModulePath = Object.keys(emitted.modules).find((path) => path.endsWith('/manifest.js'))
    ?? Object.keys(emitted.modules).find((path) => path === './manifest.js')

  if (!manifestModulePath) {
    throw new Error('Emitted Tasty modules payload did not include ./manifest.js.')
  }

  return join(outputDir, stripRelativePrefix(manifestModulePath))
}
