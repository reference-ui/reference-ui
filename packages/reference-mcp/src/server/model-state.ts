import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { log } from './logger'
import { readMcpArtifact } from '../pipeline/artifact'
import { getMcpModelPath } from '../pipeline/paths'
import type { McpBuildArtifact } from '../pipeline/types'
import { McpChildProcessError, spawnMcpBuildChild } from '../child-process/process'
import { createDeferred, type Deferred } from './deferred'

export type ProjectErrorCode =
  | 'missing_artifacts'
  | 'config_not_found'
  | 'config_invalid'
  | 'build_failed'

export interface ProjectError {
  code: ProjectErrorCode
  message: string
}

export type ModelStateStatus = 'idle' | 'warming' | 'ready' | 'error'

export interface McpModelState {
  /** Load cached artifact if present, else build; may start a background refresh when cache exists. */
  warmStart(): Promise<void>
  /** Current best artifact. Throws if not ready. Fast check. */
  load(): Promise<McpBuildArtifact>
  /** Wait for warmStart to complete, with timeout. Returns null on timeout or error. */
  waitForReady(timeoutMs?: number): Promise<McpBuildArtifact | null>
  /** Invalidate current state and trigger a fresh rebuild. */
  reload?(): Promise<void>
  /** If warmStart failed, contains the error. Used for structured error responses. */
  readonly error: ProjectError | null
  /** Current lifecycle status. */
  readonly status?: ModelStateStatus
}

export function classifyProjectError(err: unknown): ProjectError {
  if (err instanceof McpChildProcessError) {
    return {
      code: err.errorType,
      message: err.message,
    }
  }

  const msg = err instanceof Error ? err.message : String(err)
  const isMissing = msg.includes('manifest.js') || msg.includes('ref sync')
  return {
    code: isMissing ? 'missing_artifacts' : 'build_failed',
    message: msg,
  }
}

export class McpProjectModelState implements McpModelState {
  readonly cwd: string
  private currentArtifact: McpBuildArtifact | null = null
  private currentError: ProjectError | null = null
  private currentStatus: ModelStateStatus = 'idle'
  private deferred: Deferred<McpBuildArtifact | null> = createDeferred()
  private isRefreshing = false

  constructor(options: { cwd: string }) {
    this.cwd = resolve(options.cwd)
  }

  get error(): ProjectError | null {
    return this.currentError
  }

  get status(): ModelStateStatus {
    return this.currentStatus
  }

  async warmStart(): Promise<void> {
    if (this.currentStatus === 'ready' && this.currentArtifact) {
      return
    }

    if (this.currentStatus === 'warming') {
      await this.deferred.promise
      return
    }

    if (this.currentStatus === 'error') {
      this.deferred.reset()
    }

    this.currentStatus = 'warming'

    try {
      const modelPath = getMcpModelPath(this.cwd)
      if (existsSync(modelPath)) {
        try {
          const cached = await readMcpArtifact(this.cwd)
          this.setReady(cached)
          this.scheduleBackgroundRefresh()
          return
        } catch (readErr) {
          log.warn('[mcp] Failed to read cached model artifact, rebuilding:', readErr)
        }
      }

      const built = await this.buildArtifactInChild()
      this.setReady(built)
    } catch (err) {
      this.setError(classifyProjectError(err))
    }
  }

  async load(): Promise<McpBuildArtifact> {
    if (!this.currentArtifact) {
      throw new Error('[mcp] Model is not ready')
    }
    return this.currentArtifact
  }

  async waitForReady(timeoutMs = 30_000): Promise<McpBuildArtifact | null> {
    if (this.currentArtifact) {
      return this.currentArtifact
    }

    if (this.currentStatus === 'idle' || this.currentStatus === 'error') {
      void this.warmStart()
    }

    let timeoutTimer: NodeJS.Timeout | undefined
    const timeoutPromise = new Promise<null>(res => {
      timeoutTimer = setTimeout(() => res(null), timeoutMs)
    })

    try {
      return await Promise.race([this.deferred.promise, timeoutPromise])
    } finally {
      if (timeoutTimer) clearTimeout(timeoutTimer)
    }
  }

  async reload(): Promise<void> {
    this.currentStatus = 'idle'
    this.currentArtifact = null
    this.currentError = null
    this.deferred.reset()
    await this.warmStart()
  }

  private setReady(artifact: McpBuildArtifact): void {
    this.currentArtifact = artifact
    this.currentError = null
    this.currentStatus = 'ready'
    this.deferred.resolve(artifact)
  }

  private setError(error: ProjectError): void {
    this.currentError = error
    this.currentStatus = 'error'
    this.deferred.resolve(null)
  }

  private async buildArtifactInChild(): Promise<McpBuildArtifact> {
    try {
      await spawnMcpBuildChild(this.cwd)
      return await readMcpArtifact(this.cwd)
    } catch (err) {
      this.currentError = classifyProjectError(err)
      throw err
    }
  }

  private scheduleBackgroundRefresh(): void {
    if (this.isRefreshing) return
    this.isRefreshing = true

    this.buildArtifactInChild()
      .then(next => {
        this.setReady(next)
      })
      .catch(error => {
        log.warn('[mcp] Background model refresh failed:', error)
      })
      .finally(() => {
        this.isRefreshing = false
      })
  }
}

export function createMcpModelState(options: { cwd: string }): McpModelState {
  return new McpProjectModelState(options)
}
