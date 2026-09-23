/** Emitted by `spawnMonitoredAsync` for shutdown tracking and memory profiler attribution. */
export type ProcessLifecycleEvents = {
  'process:spawned': { pid: number; processName: string; threadId: number }
  'process:exit': {
    pid: number
    processName: string
    threadId: number
    code: number | null
    signal: NodeJS.Signals | null
  }
}
