import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises'
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
  api: TastyApi
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
    api,
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
