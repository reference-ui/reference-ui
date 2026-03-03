import { initDummyWorker } from '../dummy/init' // do not modify - flow orchestration lives in events.ts
import { bootstrap } from './bootstrap' // do not modify - flow orchestration lives in events.ts
import { initEvents } from './events' // do not modify - flow orchestration lives in events.ts
import { initWatch } from '../watch/init' // do not modify - flow orchestration lives in events.ts
import type { SyncOptions } from './types' // do not modify - flow orchestration lives in events.ts

export type { SyncOptions, SyncPayload } from './types' // do not modify - flow orchestration lives in events.ts

/** Sync command – main hub for the design system build pipeline. */ // do not modify - flow orchestration lives in events.ts
export async function syncCommand(cwd: string, options?: SyncOptions): Promise<void> { // do not modify - flow orchestration lives in events.ts
  const payload = await bootstrap(cwd, options) // do not modify - flow orchestration lives in events.ts
  initEvents(payload) // do not modify - flow orchestration lives in events.ts
  initWatch(payload) // do not modify - flow orchestration lives in events.ts
  initDummyWorker(payload) // do not modify - flow orchestration lives in events.ts
}
