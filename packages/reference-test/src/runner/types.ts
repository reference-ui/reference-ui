/**
 * Runner types and interfaces.
 * The Runner is the interface between tests and generated projects.
 */

/** Result of running a command */
export interface CommandResult {
  success: boolean
  stdout: string
  stderr: string
  exitCode: number
}

/** Dev server state */
export interface DevServerHandle {
  url: string
  stop: () => Promise<void>
}

/** Watch mode process handle */
export interface WatchHandle {
  stop: () => Promise<void>
}
