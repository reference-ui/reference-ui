import type { GetSyncSessionOptions, SyncSession } from '../session'

export type ReferenceSyncSessionReader = (options: GetSyncSessionOptions) => SyncSession

export interface ManagedOutputSubscription {
  unsubscribe(): Promise<void> | void
}

export type ManagedOutputWriter = (file: string) => void

export type ManagedOutputWriteSubscriber = (
  projectPaths: ReferenceProjectPaths,
  onWrite: ManagedOutputWriter
) => Promise<ManagedOutputSubscription>

export interface ReferenceBundlerInternals {
  getSyncSession?: ReferenceSyncSessionReader
  subscribeToManagedOutputWrites?: ManagedOutputWriteSubscriber
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