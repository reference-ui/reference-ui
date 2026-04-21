import { runCommand } from '../lib/run'
import { syncCommand } from './command'
import type { SyncOptions } from './types'

export function runSync(options?: Partial<SyncOptions>) {
  return runCommand(commandOptions =>
    syncCommand(process.cwd(), {
      ...(commandOptions as SyncOptions),
      ...options,
    })
  )
}