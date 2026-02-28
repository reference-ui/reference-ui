import { onceAll } from '../event-bus'

export type InitSyncCompleteConfig = {
  skipTypescript?: boolean
}

/** Register listener for cold sync gates. When all fire, exits process. No-op in watch mode. */
export function initSyncComplete(
  config: InitSyncCompleteConfig,
  watch?: boolean
): void {
  if (watch) return

  const gates =
    config.skipTypescript === true
      ? ['packager:complete']
      : ['packager:complete', 'packager-ts:complete']
  onceAll(gates, () => process.exit(0))
}
