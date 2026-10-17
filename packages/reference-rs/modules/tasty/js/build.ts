/**
 * Artifact builder module compiling Tasty TypeScript ASTs into disk-persisted bundles.
 * Coordinates native scanning, manifest generation, and type declaration emission.
 * Stages generated chunks and index maps in a sibling temp dir, then swaps them into
 * the output dir file by file. The manifest is swapped last and stale outputs are removed
 * after it, so a concurrent reader never sees the output dir or a file this build emits missing.
 * Provides caching session wrappers for efficient incremental compiler workflows.
 */
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'

import { scanAndEmitModules, type TastyDiagnostic } from './runtime.js'
import { createTastyApi, type TastyApi } from './index.js'

interface EmittedModulesPayload {
  modules: Record<string, string>
  type_declarations: Record<string, string>
  diagnostics?: TastyDiagnostic[]
}

export interface TastyBuildDiagnostic {
  level: 'warning' | 'error'
  source: 'scanner' | 'manifest'
  code: string
  message: string
  file?: string
  line?: number
  column?: number
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
  warnings: TastyDiagnostic[]
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
  const rawPayload = scanAndEmitModules(rootDir, options.include)
  const emitted = validateEmittedPayload(rawPayload)

  await writeEmittedArtifacts(outputDir, emitted)

  const manifestPath = resolveManifestPath(outputDir, emitted)
  const api = createTastyApi({ manifestPath })
  await api.ready()
  const warnings = api.getWarnings()
  const scannerDiagnostics = normalizeScannerDiagnostics(emitted.diagnostics)
  const scannerKeys = new Set(scannerDiagnostics.map(diagnosticKey))
  const manifestDiagnostics = warnings
    .filter(warning => !scannerKeys.has(diagnosticKey(warning)))
    .map(warning => ({
      level: warning.severity,
      source: 'manifest' as const,
      code: warning.code,
      message: warning.message,
      file: warning.file,
      line: warning.line,
      column: warning.column,
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

  /**
   * A request never joins a build already in flight: that scan may predate the
   * request. It queues behind the in-flight run and scans fresh, so builds for one
   * key never overlap and the latest request's sources win. An idle key scans at once.
   */
  async rebuild(key: string, options: BuildTastyOptions): Promise<BuiltTasty> {
    const inFlight = this.rebuildsByKey.get(key)
    const rebuild = inFlight
      ? inFlight.then(
          () => this.buildAndCache(key, options),
          () => this.buildAndCache(key, options)
        )
      : this.buildAndCache(key, options)

    this.rebuildsByKey.set(key, rebuild)
    const release = (): void => {
      // A newer request may have replaced this run as the key's latest: keep its entry.
      if (this.rebuildsByKey.get(key) === rebuild) this.rebuildsByKey.delete(key)
    }
    rebuild.then(release, release)
    return rebuild
  }

  private buildAndCache(key: string, options: BuildTastyOptions): Promise<BuiltTasty> {
    return buildTasty(options).then(built => {
      this.buildsByKey.set(key, built)
      return built
    })
  }

  async getOrRebuild(key: string, options: BuildTastyOptions): Promise<BuiltTasty> {
    return (await this.ensureReady(key)) ?? (await this.rebuild(key, options))
  }
}

function validateEmittedPayload(
  parsed: Partial<EmittedModulesPayload>
): EmittedModulesPayload {
  if (
    parsed.modules == null ||
    typeof parsed.modules !== 'object' ||
    parsed.type_declarations == null ||
    typeof parsed.type_declarations !== 'object' ||
    (parsed.diagnostics != null && !isTastyDiagnostics(parsed.diagnostics))
  ) {
    throw new Error('Malformed emitted Tasty modules payload.')
  }
  return {
    modules: parsed.modules as Record<string, string>,
    type_declarations: parsed.type_declarations as Record<string, string>,
    diagnostics: parsed.diagnostics ?? [],
  }
}

function isTastyDiagnostics(value: unknown): value is TastyDiagnostic[] {
  return Array.isArray(value) && value.every(isTastyDiagnosticEntry)
}

function isTastyDiagnosticEntry(entry: unknown): entry is TastyDiagnostic {
  if (entry == null || typeof entry !== 'object') return false
  return hasRequiredDiagnosticFields(entry) && hasOptionalDiagnosticFields(entry)
}

function hasRequiredDiagnosticFields(entry: object): boolean {
  return (
    'severity' in entry &&
    (entry.severity === 'warning' || entry.severity === 'error') &&
    'code' in entry &&
    typeof entry.code === 'string' &&
    entry.code.length > 0 &&
    'message' in entry &&
    typeof entry.message === 'string' &&
    entry.message.length > 0
  )
}

function hasOptionalDiagnosticFields(entry: object): boolean {
  return (
    (!('file' in entry) || typeof entry.file === 'string') &&
    (!('line' in entry) || typeof entry.line === 'number') &&
    (!('column' in entry) || typeof entry.column === 'number')
  )
}

function normalizeScannerDiagnostics(
  diagnostics: TastyDiagnostic[] | undefined
): TastyBuildDiagnostic[] {
  return (diagnostics ?? []).map(diagnostic => ({
    level: diagnostic.severity,
    source: 'scanner',
    code: diagnostic.code,
    message: diagnostic.message,
    file: diagnostic.file,
    line: diagnostic.line,
    column: diagnostic.column,
  }))
}

function diagnosticKey(diagnostic: {
  code: string
  message: string
  file?: string
}): string {
  return [diagnostic.code, diagnostic.message, diagnostic.file ?? ''].join('\0')
}

async function writeEmittedArtifacts(
  outputDir: string,
  emitted: EmittedModulesPayload
): Promise<void> {
  const manifestRelativePath = findManifestRelativePath(emitted)
  const files = { ...emitted.modules, ...emitted.type_declarations }
  await mkdir(dirname(outputDir), { recursive: true })

  // The pid lets a sync commit tell a live writer's stage from a killed one's.
  const tempDir = await mkdtemp(
    join(dirname(outputDir), `${basename(outputDir)}.tmp-${process.pid}-`)
  )

  try {
    await stageEmittedFiles(tempDir, files)
    await swapStagedFiles(
      outputDir,
      tempDir,
      Object.keys(files).map(path => stripRelativePrefix(path)),
      manifestRelativePath
    )
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}

async function stageEmittedFiles(
  tempDir: string,
  files: Record<string, string>
): Promise<void> {
  await Promise.all(
    Object.entries(files).map(async ([relativePath, source]) => {
      const stagedPath = join(tempDir, stripRelativePrefix(relativePath))
      await mkdir(dirname(stagedPath), { recursive: true })
      await writeFile(stagedPath, source.endsWith('\n') ? source : `${source}\n`, 'utf-8')
    })
  )
}

/** The manifest moves last, so a reader that sees it finds every file it names in place. */
async function swapStagedFiles(
  outputDir: string,
  tempDir: string,
  relativePaths: string[],
  manifestRelativePath: string
): Promise<void> {
  // The live dir itself is never removed, so a poller on it never sees it vanish.
  await mkdir(outputDir, { recursive: true })

  const otherPaths = relativePaths.filter(path => path !== manifestRelativePath)
  await Promise.all(otherPaths.map(path => swapFileIn(outputDir, tempDir, path)))
  await swapFileIn(outputDir, tempDir, manifestRelativePath)

  await removeStaleOutputs(outputDir, relativePaths)
}

async function swapFileIn(
  outputDir: string,
  tempDir: string,
  relativePath: string
): Promise<void> {
  const stagedPath = join(tempDir, relativePath)
  const livePath = join(outputDir, relativePath)
  // Unchanged files stay untouched so bundler watchers see no mtime churn.
  if (await hasSameBytes(stagedPath, livePath)) return

  await mkdir(dirname(livePath), { recursive: true })
  // rename over an existing file is atomic: readers see the old bytes or the new ones.
  await rename(stagedPath, livePath)
}

async function hasSameBytes(stagedPath: string, livePath: string): Promise<boolean> {
  const live = await readFileIfPresent(livePath)
  return live !== undefined && live.equals(await readFile(stagedPath))
}

async function readFileIfPresent(path: string): Promise<Buffer | undefined> {
  try {
    return await readFile(path)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

/** Deletes live files this build did not emit. Directories are left in place. */
async function removeStaleOutputs(
  outputDir: string,
  relativePaths: string[]
): Promise<void> {
  const emittedPaths = new Set(relativePaths.map(path => join(outputDir, path)))
  const livePaths = await listFilePaths(outputDir)
  await Promise.all(
    livePaths
      .filter(livePath => !emittedPaths.has(livePath))
      .map(livePath => rm(livePath, { force: true }))
  )
}

async function listFilePaths(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(entry => {
      const entryPath = join(dir, entry.name)
      return entry.isDirectory() ? listFilePaths(entryPath) : [entryPath]
    })
  )
  return nested.flat()
}

function stripRelativePrefix(relativePath: string): string {
  return relativePath.replace(/^\.\//, '')
}

function findManifestRelativePath(emitted: EmittedModulesPayload): string {
  const manifestModulePath =
    Object.keys(emitted.modules).find(path => path.endsWith('/manifest.js')) ??
    Object.keys(emitted.modules).find(path => path === './manifest.js')

  if (!manifestModulePath) {
    throw new Error('Emitted Tasty modules payload did not include ./manifest.js.')
  }

  return stripRelativePrefix(manifestModulePath)
}

function resolveManifestPath(outputDir: string, emitted: EmittedModulesPayload): string {
  return join(outputDir, findManifestRelativePath(emitted))
}
