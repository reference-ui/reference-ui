import { resolve } from 'node:path'
import {
  loadUserConfig,
  setConfig,
  setCwd,
  ConfigNotFoundError,
  ConfigValidationError,
} from '@reference-ui/core/config'
import { buildMcpArtifact, prefetchMcpAtlas } from '../pipeline/build'
import { getMcpModelPath } from '../pipeline/paths'

type McpChildMessage =
  | { kind: 'build'; cwd: string }
  | { kind: 'prefetch-atlas'; cwd: string }

function fatal(message: string): never {
  console.error(message)
  process.exit(1)
}

function parseArgvPayload(): McpChildMessage {
  const raw = process.argv[2]
  if (raw == null || raw === '') {
    fatal('mcp-child: missing JSON payload (argv[2])')
  }
  try {
    return JSON.parse(raw) as McpChildMessage
  } catch {
    fatal('mcp-child: invalid JSON payload')
  }
}

async function runMcpChildWork(msg: McpChildMessage): Promise<void> {
  const cwd = resolve(msg.cwd)
  const config = await loadUserConfig(cwd)
  setConfig(config)
  setCwd(cwd)

  if (msg.kind === 'prefetch-atlas') {
    await prefetchMcpAtlas({ cwd, refresh: true })
    console.log(JSON.stringify({ ok: true as const, kind: 'prefetch-atlas' as const }))
    return
  }

  const artifact = await buildMcpArtifact({ cwd, force: true })
  console.log(
    JSON.stringify({
      ok: true as const,
      kind: 'build' as const,
      modelPath: getMcpModelPath(cwd),
      componentCount: artifact.components.length,
    }),
  )
}

async function main(): Promise<void> {
  let msg: McpChildMessage | undefined
  try {
    msg = parseArgvPayload()
    await runMcpChildWork(msg)
    process.exit(0)
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e)
    const isConfigNotFound =
      e instanceof ConfigNotFoundError ||
      (e instanceof Error && e.name === 'ConfigNotFoundError') ||
      errMsg.includes('No ui.config.')
    const isConfigInvalid =
      e instanceof ConfigValidationError ||
      (e instanceof Error && e.name === 'ConfigValidationError') ||
      errMsg.includes('Invalid ui.config')
    const isMissingArtifacts =
      errMsg.includes('manifest.js') || errMsg.includes('ref sync')

    const errorType = isConfigNotFound
      ? 'config_not_found'
      : isConfigInvalid
        ? 'config_invalid'
        : isMissingArtifacts
          ? 'missing_artifacts'
          : 'build_failed'

    const errorPayload = {
      ok: false as const,
      kind: msg?.kind ?? 'unknown',
      error: errorType,
      message: errMsg,
    }

    console.log(JSON.stringify(errorPayload))
    console.error(errMsg)
    process.exit(1)
  }
}

main()
