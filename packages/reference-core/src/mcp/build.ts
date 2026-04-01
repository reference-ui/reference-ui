import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { analyzeDetailed } from '@reference-ui/rust/atlas'
import { getConfig } from '../config'
import { log } from '../lib/log'
import { joinMcpComponent } from './join'
import { getAtlasMcpConfig } from './config'
import { createReferenceApi, loadReferenceDocument } from './reference'
import { readMcpArtifact, writeMcpArtifact } from './artifact'
import { getMcpModelPath, getMcpTypesManifestPath } from './paths'
import type { McpBuildArtifact } from './types'

export interface BuildMcpArtifactOptions {
  cwd: string
  force?: boolean
}

export async function buildMcpArtifact(
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

  const atlas = await analyzeDetailed(cwd, getAtlasMcpConfig(getConfig()))
  const api = createReferenceApi(manifestPath)
  const components = await Promise.all(
    atlas.components.map(async component => {
      const document = component.interface?.name
        ? await loadReferenceDocument(
            api,
            component.interface.name,
            component.interface.source
          )
        : null
      return joinMcpComponent(component, document)
    })
  )

  const artifact: McpBuildArtifact = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    workspaceRoot: cwd,
    manifestPath,
    diagnostics: atlas.diagnostics,
    components: components.sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count
      if (left.name !== right.name) return left.name.localeCompare(right.name)
      return left.source.localeCompare(right.source)
    }),
  }

  await writeMcpArtifact(cwd, artifact)
  return artifact
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
