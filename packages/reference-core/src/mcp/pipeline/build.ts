import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { analyzeDetailed } from '@reference-ui/rust/atlas'
import { getConfig } from '../../config'
import { log } from '../../lib/log'
import { joinMcpComponentWithReference } from './join'
import { getAtlasMcpConfig } from './config'
import { createReferenceApi, loadMcpReferenceData } from './reference'
import { readMcpArtifact, writeMcpArtifact } from './artifact'
import { getMcpModelPath, getMcpTypesManifestPath } from './paths'
import type { McpBuildArtifact } from './types'
import { loadMcpTokens } from './tokens'
import { collectReferenceUiPrimitiveUsage } from './primitive-usage'
import { createObservedReferenceUiPrimitives } from './primitives'

const mcpAtlasBuildCache = new Map<
  string,
  {
    key: string
    promise: Promise<Awaited<ReturnType<typeof analyzeDetailed>>>
  }
>()

export interface BuildMcpArtifactOptions {
  cwd: string
  force?: boolean
}

export async function buildMcpArtifact(
  options: BuildMcpArtifactOptions
): Promise<McpBuildArtifact> {
  const artifact = await generateMcpArtifact(options)
  await writeMcpArtifact(resolve(options.cwd), artifact)
  return artifact
}

export async function generateMcpArtifact(
  options: BuildMcpArtifactOptions
): Promise<McpBuildArtifact> {
  const cwd = resolve(options.cwd)
  const manifestPath = getMcpTypesManifestPath(cwd)

  if (!existsSync(manifestPath)) {
    throw new Error(
      `MCP build requires generated types manifest at "${manifestPath}". Run ref sync first.`
    )
  }

  log.debug('mcp', 'Building MCP model', { cwd, manifestPath })

  const config = getConfig()
  const atlas = await loadMcpAtlas(cwd)
  return generateMcpArtifactFromAtlas({
    cwd,
    manifestPath,
    atlas,
    tokens: await loadMcpTokensSafely(cwd, config),
    primitiveComponents: createObservedReferenceUiPrimitives(
      await loadReferenceUiPrimitiveUsageSafely(cwd, config)
    ),
  })
}

export function prefetchMcpAtlas(options: {
  cwd: string
  refresh?: boolean
}): Promise<Awaited<ReturnType<typeof analyzeDetailed>>> {
  const cwd = resolve(options.cwd)
  const atlasConfig = getAtlasMcpConfig(getConfig())
  const cacheKey = JSON.stringify(atlasConfig ?? null)
  const cached = mcpAtlasBuildCache.get(cwd)

  if (!options.refresh && cached?.key === cacheKey) {
    return cached.promise
  }

  const promise = analyzeDetailed(cwd, atlasConfig).catch(error => {
    const current = mcpAtlasBuildCache.get(cwd)
    if (current?.promise === promise) {
      mcpAtlasBuildCache.delete(cwd)
    }
    throw error
  })

  mcpAtlasBuildCache.set(cwd, {
    key: cacheKey,
    promise,
  })

  return promise
}

export function clearMcpAtlasCache(cwd?: string): void {
  if (cwd) {
    mcpAtlasBuildCache.delete(resolve(cwd))
    return
  }

  mcpAtlasBuildCache.clear()
}

function loadMcpAtlas(cwd: string): Promise<Awaited<ReturnType<typeof analyzeDetailed>>> {
  return prefetchMcpAtlas({ cwd })
}

export async function generateMcpArtifactFromAtlas(input: {
  cwd: string
  manifestPath: string
  atlas: Awaited<ReturnType<typeof analyzeDetailed>>
  tokens?: McpBuildArtifact['tokens']
  primitiveComponents?: McpBuildArtifact['components']
}): Promise<McpBuildArtifact> {
  const { cwd, manifestPath, atlas, tokens = [], primitiveComponents = [] } = input
  const api = createReferenceApi(manifestPath)
  const components = await Promise.all(
    atlas.components.map(async component => {
      let reference = null

      if (component.interface?.name) {
        try {
          reference = await loadMcpReferenceData(
            api,
            component.interface.name,
            component.interface.source
          )
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          throw new Error(
            `MCP enrichment failed for interface "${component.interface.name}" (${component.interface.source}): ${message}`,
            {
              cause: error,
            }
          )
        }
      }

      return joinMcpComponentWithReference(component, reference)
    })
  )

  const artifact: McpBuildArtifact = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    workspaceRoot: cwd,
    manifestPath,
    diagnostics: atlas.diagnostics,
    components: [...components, ...primitiveComponents].sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count
      if (left.name !== right.name) return left.name.localeCompare(right.name)
      return left.source.localeCompare(right.source)
    }),
    tokens,
  }

  return artifact
}

async function loadReferenceUiPrimitiveUsageSafely(
  cwd: string,
  config: ReturnType<typeof getConfig>
) {
  try {
    return await collectReferenceUiPrimitiveUsage(cwd, config)
  } catch (error) {
    log.warn('[mcp] Primitive usage collection failed:', error)
    return []
  }
}

async function loadMcpTokensSafely(
  cwd: string,
  config: ReturnType<typeof getConfig>
): Promise<McpBuildArtifact['tokens']> {
  if (!config) return []

  try {
    return await loadMcpTokens(cwd, config)
  } catch (error) {
    log.warn('[mcp] Token collection failed:', error)
    return []
  }
}

export async function loadOrBuildMcpArtifact(
  options: BuildMcpArtifactOptions
): Promise<McpBuildArtifact> {
  const cwd = resolve(options.cwd)
  const modelPath = getMcpModelPath(cwd)

  if (!options.force && existsSync(modelPath)) {
    return readMcpArtifact(cwd)
  }

  return buildMcpArtifact({ cwd, force: options.force })
}
