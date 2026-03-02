import { log } from '../lib/log'

export type SyncOptions = {
  watch?: boolean
}

export async function syncCommand(
  cwd: string,
  options?: SyncOptions
): Promise<void> {
  log.info('hello world')
  if (options?.watch) {
    // Keep process alive when running in background
    setInterval(() => {}, 60_000)
  }
}
