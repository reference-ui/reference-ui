import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, rename, rm, writeFile, lstat, readdir, realpath, symlink } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'

import { scanAndEmitModules } from '../runtime/index'
import { createTastyApi, type TastyApi } from './index'

interface EmittedModulesPayload {
  modules: Record<string, string>
  type_declarations: Record<string, string>
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

  return {
    rootDir,
    outputDir,
    manifestPath,
    warnings: api.getWarnings(),
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
    typeof parsed.type_declarations !== 'object'
  ) {
    throw new Error('Malformed emitted Tasty modules payload.')
  }
  return parsed as EmittedModulesPayload
}

async function writeEmittedArtifacts(
  outputDir: string,
  emitted: EmittedModulesPayload
): Promise<void> {
  const outputParentDir = dirname(outputDir)
  const outputStoreDir = join(outputParentDir, `.${basename(outputDir)}.versions`)
  await mkdir(outputParentDir, { recursive: true })
  await mkdir(outputStoreDir, { recursive: true })

  const tempDir = await mkdtemp(join(outputStoreDir, `${basename(outputDir)}.build-`))

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

    await activateOutputDir(outputDir, tempDir, outputStoreDir)
    await cleanupStaleOutputVersions(outputDir, outputStoreDir)
  } catch (error) {
    await rm(tempDir, { recursive: true, force: true })
    throw error
  }
}

async function activateOutputDir(
  outputDir: string,
  nextVersionDir: string,
  outputStoreDir: string
): Promise<void> {
  const nextLinkPath = join(outputStoreDir, `${basename(outputDir)}.next-${randomUUID()}`)
  const legacyVersionDir = join(outputStoreDir, `${basename(outputDir)}.legacy-${randomUUID()}`)
  const symlinkType = process.platform === 'win32' ? 'junction' : 'dir'
  let migratedLegacyDir = false

  await symlink(nextVersionDir, nextLinkPath, symlinkType)

  try {
    const existing = await lstat(outputDir).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return undefined
      throw error
    })

    if (!existing) {
      await rename(nextLinkPath, outputDir)
      return
    }

    if (existing.isSymbolicLink()) {
      await rename(nextLinkPath, outputDir)
      return
    }

    if (!existing.isDirectory()) {
      throw new Error(`Expected Tasty output path "${outputDir}" to be a directory or symlink.`)
    }

    await rename(outputDir, legacyVersionDir)
    migratedLegacyDir = true

    try {
      await rename(nextLinkPath, outputDir)
    } catch (error) {
      await rename(legacyVersionDir, outputDir).catch(() => undefined)
      throw error
    }
  } finally {
    await rm(nextLinkPath, { force: true }).catch(() => undefined)

    if (!migratedLegacyDir) {
      await rm(legacyVersionDir, { recursive: true, force: true }).catch(() => undefined)
    }
  }
}

async function cleanupStaleOutputVersions(outputDir: string, outputStoreDir: string): Promise<void> {
  const currentVersionDir = await realpath(outputDir)
  const currentVersionDirName = basename(currentVersionDir)
  const storeEntries = await readdir(outputStoreDir, { withFileTypes: true })

  await Promise.all(
    storeEntries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        if (entry.name === currentVersionDirName) return
        const entryPath = join(outputStoreDir, entry.name)
        await rm(entryPath, { recursive: true, force: true })
      })
  )
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
