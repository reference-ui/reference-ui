import type { GetSyncSessionOptions, SyncSession } from '../session'

export type ReferenceSyncSessionReader = (options: GetSyncSessionOptions) => SyncSession

export interface ReferenceBundlerInternals {
  getSyncSession?: ReferenceSyncSessionReader
}

export interface ReferenceBundlerOptions {
  internals?: ReferenceBundlerInternals
}

export interface ReferenceProjectPaths {
  projectRoot: string
  outDir: string
  managedOutputRoots: Set<string>
}

export interface ManagedWriteBuffer {
  remember(file: string): void
  flush(flushPendingWrites: (pendingFiles: Set<string>) => void): void
  clear(): void
}

export interface ManagedOutputSubscription {
  unsubscribe(): Promise<void> | void
}