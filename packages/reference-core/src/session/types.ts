export type SessionState = 'starting' | 'watching' | 'stopping' | 'stopped' | 'failed'

export type BuildState = 'idle' | 'queued' | 'running' | 'ready' | 'failed'

export type SessionMode = 'watch' | 'one-shot'

/** Written to `.reference-ui/session.json` by `ref sync`. */
export interface SessionManifest {
  pid: number
  mode: SessionMode
  state: SessionState
  buildState: BuildState
  startedAt: string
  updatedAt: string
}

/** Written to `.reference-ui/session.lock` to prevent concurrent writers. */
export interface SessionLock {
  pid: number
  startedAt: string
}

export interface RefreshEvent {
  changedOutputs: string[]
}

export type RefreshHandler = (event: RefreshEvent) => void

/** Handle returned by `getSyncSession`. */
export interface SyncSession {
  /** Register a callback that fires each time a logical build completes. Returns an unsubscribe function. */
  onRefresh(handler: RefreshHandler): () => void
  /** Stop watching and release resources. */
  dispose(): void
}

export interface GetSyncSessionOptions {
  cwd: string
  /**
   * Explicit path to the Reference UI output directory (absolute, or relative
   * to `cwd`). When omitted, `getSyncSession` walks up from `cwd` looking for
   * a `.reference-ui/session.json`. Set this when the project uses a custom
   * `outDir` in its `reference-ui.config.*`.
   */
  outDir?: string
}
