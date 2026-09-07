import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

function resolveMcpChildScript(): string {
  const here = dirname(fileURLToPath(import.meta.url))
  const candidates = [
    join(here, 'mcp-child.mjs'),
    join(here, '../dist/mcp-child.mjs'),
    join(here, '../../dist/mcp-child.mjs'),
    join(here, '../mcp-child.mjs'),
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  return join(here, 'mcp-child.mjs')
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

export interface McpChildErrorPayload {
  ok: false
  kind: string
  error: 'config_not_found' | 'config_invalid' | 'missing_artifacts' | 'build_failed'
  message: string
}

export class McpChildProcessError extends Error {
  constructor(
    public readonly errorType: 'config_not_found' | 'config_invalid' | 'missing_artifacts' | 'build_failed',
    message: string,
  ) {
    super(message)
    this.name = 'McpChildProcessError'
  }
}

async function spawnNodeChild(
  command: string,
  args: string[],
  options: { cwd: string }
): Promise<{ code: number | null; signal: NodeJS.Signals | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', chunk => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', chunk => {
      stderr += chunk.toString()
    })
    child.on('error', reject)
    child.on('exit', (code, signal) => {
      resolve({ code, signal, stdout, stderr })
    })
  })
}

function formatSpawnFailure(result: {
  code: number | null
  signal: NodeJS.Signals | null
  stderr: string
}): string {
  if (result.stderr.trim()) return result.stderr.trim()
  return `child process exited with code ${result.code ?? 'unknown'} signal ${result.signal ?? 'none'}`
}

/**
 * Run full MCP artifact build (Atlas + Tasty + model.json) in a short-lived Node
 * child so heavy graphs are not retained in the MCP server process.
 */
export async function spawnMcpBuildChild(projectCwd: string): Promise<McpBuildChildResult> {
  const childScript = resolveMcpChildScript()
  if (!existsSync(childScript)) {
    throw new Error(`mcp-child not found at ${childScript}; build @reference-ui/mcp first`)
  }

  const json = JSON.stringify({ kind: 'build' as const, cwd: projectCwd })

  const { code, signal, stderr, stdout } = await spawnNodeChild(
    process.execPath,
    [childScript, json],
    { cwd: projectCwd }
  )

  if (code !== 0) {
    try {
      const parsed = parseChildJsonLine<McpChildErrorPayload>(stdout)
      if (!parsed.ok && parsed.error) {
        throw new McpChildProcessError(parsed.error, parsed.message)
      }
    } catch (parseError) {
      if (parseError instanceof McpChildProcessError) {
        throw parseError
      }
    }

    const detail = formatSpawnFailure({ code, signal, stderr })
    throw new Error(`MCP build failed in child process:\n${detail}`)
  }

  const parsed = parseChildJsonLine<{ ok: true; kind: 'build'; modelPath: string; componentCount: number }>(stdout)
  if (!parsed.ok || parsed.kind !== 'build') {
    throw new Error(`Unexpected child payload: ${stdout}`)
  }

  return {
    modelPath: parsed.modelPath,
    componentCount: parsed.componentCount,
  }
}

/**
 * Warm Atlas analysis in a short-lived child so the main server does not retain it.
 */
export async function spawnMcpPrefetchAtlasChild(projectCwd: string): Promise<void> {
  const childScript = resolveMcpChildScript()
  if (!existsSync(childScript)) {
    throw new Error(`mcp-child not found at ${childScript}; build @reference-ui/mcp first`)
  }

  const json = JSON.stringify({ kind: 'prefetch-atlas' as const, cwd: projectCwd })

  const { code, signal, stderr, stdout } = await spawnNodeChild(
    process.execPath,
    [childScript, json],
    { cwd: projectCwd }
  )

  if (code !== 0) {
    const detail = formatSpawnFailure({ code, signal, stderr })
    throw new Error(`MCP Atlas prefetch failed in child process:\n${detail}`)
  }

  const parsed = parseChildJsonLine<{ ok: true; kind: 'prefetch-atlas' }>(stdout)
  if (!parsed.ok || parsed.kind !== 'prefetch-atlas') {
    throw new Error(`Unexpected child payload: ${stdout}`)
  }
}
