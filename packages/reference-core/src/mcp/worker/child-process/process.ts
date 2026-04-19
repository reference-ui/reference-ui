import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { resolveCorePackageDir } from '../../../lib/paths'
import { formatSpawnMonitoredFailure, spawnMonitoredAsync } from '../../../lib/child-process'

function resolveMcpChildScript(projectCwd: string): string {
  const coreDir = resolveCorePackageDir(projectCwd)
  return join(coreDir, 'dist/cli/mcp-child.mjs')
}

function parseChildJsonLine<T>(stdout: string): T {
  const lines = stdout
    .trim()
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
  const last = lines[lines.length - 1]
  if (!last) {
    throw new Error('mcp-child produced no output')
  }
  return JSON.parse(last) as T
}

export type McpBuildChildResult = {
  modelPath: string
  componentCount: number
}

/**
 * Run full MCP artifact build (Atlas + Tasty + model.json) in a short-lived Node
 * child so heavy graphs are not retained in the MCP worker isolate.
 */
export async function spawnMcpBuildChild(projectCwd: string): Promise<McpBuildChildResult> {
  const childScript = resolveMcpChildScript(projectCwd)
  if (!existsSync(childScript)) {
    throw new Error(`mcp-child not found at ${childScript}; build @reference-ui/core first`)
  }

  const json = JSON.stringify({ kind: 'build' as const, cwd: projectCwd })

  const { code, signal, stderr, stdout } = await spawnMonitoredAsync(
    process.execPath,
    [childScript, json],
    {
      cwd: projectCwd,
      processName: 'mcp-child',
      logCategory: 'mcp',
    },
  )

  if (code !== 0) {
    throw new Error(formatSpawnMonitoredFailure('mcp-child', { code, signal, stderr, stdout }))
  }

  const parsed = parseChildJsonLine<{
    ok: true
    kind: 'build'
    modelPath: string
    componentCount: number
  }>(stdout)
  if (!parsed.ok || parsed.kind !== 'build') {
    throw new Error('mcp-child returned malformed JSON')
  }
  return { modelPath: parsed.modelPath, componentCount: parsed.componentCount }
}

/**
 * Warm Atlas analysis in a short-lived child so the MCP worker does not retain it.
 */
export async function spawnMcpPrefetchAtlasChild(projectCwd: string): Promise<void> {
  const childScript = resolveMcpChildScript(projectCwd)
  if (!existsSync(childScript)) {
    throw new Error(`mcp-child not found at ${childScript}; build @reference-ui/core first`)
  }

  const json = JSON.stringify({ kind: 'prefetch-atlas' as const, cwd: projectCwd })

  const { code, signal, stderr, stdout } = await spawnMonitoredAsync(
    process.execPath,
    [childScript, json],
    {
      cwd: projectCwd,
      processName: 'mcp-child',
      logCategory: 'mcp',
    },
  )

  if (code !== 0) {
    throw new Error(
      formatSpawnMonitoredFailure('mcp-child (prefetch)', { code, signal, stderr, stdout })
    )
  }

  const parsed = parseChildJsonLine<{ ok: true; kind: 'prefetch-atlas' }>(stdout)
  if (!parsed.ok || parsed.kind !== 'prefetch-atlas') {
    throw new Error('mcp-child (prefetch) returned malformed JSON')
  }
}
