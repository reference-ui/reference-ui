import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { log } from '../../lib/log'
import { readMcpArtifact } from '../pipeline/artifact'
import { getMcpModelPath } from '../pipeline/paths'
import type { McpBuildArtifact } from '../pipeline/types'
import { McpChildProcessError, spawnMcpBuildChild } from '../worker/child-process/process'

export interface ProjectError {
  code: 'missing_artifacts' | 'config_not_found' | 'config_invalid' | 'build_failed'
  message: string
}

export interface McpModelState {
  /** Load cached artifact if present, else build; may start a background refresh when cache exists. */
  warmStart(): Promise<void>
  /** Current best artifact. Throws if not ready. Fast synchronous check. */
  load(): Promise<McpBuildArtifact>
  /** Wait for warmStart to complete, with timeout. Returns null on timeout or error. */
  waitForReady(timeoutMs?: number): Promise<McpBuildArtifact | null>
  /** If warmStart failed, contains the error. Used for structured error responses. */
  readonly error: ProjectError | null
}

export function createMcpModelState(options: { cwd: string }): McpModelState {
  const cwd = resolve(options.cwd)
  let artifact: McpBuildArtifact | null = null
  let bgRunning = false
  let projectError: ProjectError | null = null

  let readyResolve: (art: McpBuildArtifact | null) => void
  let isReadySettled = false
  const readyPromise = new Promise<McpBuildArtifact | null>(res => {
    readyResolve = res
  })

  function settleReady(val: McpBuildArtifact | null) {
    if (!isReadySettled) {
      isReadySettled = true
      readyResolve(val)
    }
  }

  async function buildArtifactInChild(): Promise<McpBuildArtifact> {
    try {
      await spawnMcpBuildChild(cwd)
      const art = await readMcpArtifact(cwd)
      projectError = null
      return art
    } catch (err) {
      if (err instanceof McpChildProcessError) {
        projectError = {
          code: err.errorType,
          message: err.message,
        }
      } else {
        const msg = err instanceof Error ? err.message : String(err)
        const isMissing = msg.includes('manifest.js') || msg.includes('ref sync')
        projectError = {
          code: isMissing ? 'missing_artifacts' : 'build_failed',
          message: msg,
        }
      }
      throw err
    }
  }

  function scheduleBackgroundRefresh(): void {
    if (bgRunning) return
    bgRunning = true
    buildArtifactInChild()
      .then(next => {
        artifact = next
        settleReady(next)
      })
      .catch(error => {
        log.warn('[mcp] Background model refresh failed:', error)
      })
      .finally(() => {
        bgRunning = false
      })
  }

  return {
    get error() {
      return projectError
    },

    async warmStart(): Promise<void> {
      try {
        const modelPath = getMcpModelPath(cwd)
        if (existsSync(modelPath)) {
          artifact = await readMcpArtifact(cwd)
          settleReady(artifact)
          scheduleBackgroundRefresh()
        } else {
          artifact = await buildArtifactInChild()
          settleReady(artifact)
        }
      } catch {
        settleReady(null)
      }
    },

    async load(): Promise<McpBuildArtifact> {
      if (!artifact) {
        throw new Error('[mcp] Model is not ready')
      }
      return artifact
    },

    async waitForReady(timeoutMs = 30_000): Promise<McpBuildArtifact | null> {
      if (artifact) return artifact

      let timeoutTimer: NodeJS.Timeout | undefined
      const timeoutPromise = new Promise<null>(res => {
        timeoutTimer = setTimeout(() => res(null), timeoutMs)
      })

      try {
        const result = await Promise.race([readyPromise, timeoutPromise])
        return result
      } finally {
        if (timeoutTimer) clearTimeout(timeoutTimer)
      }
    },
  }
}
