// Callable-members fixture entry: it re-exports the interface the way a real consumer barrel
// would. Tasty scans every fixture file, so symbols only declared in `types.ts` still land in the manifest.

export type { Notifier, NotifyOptions } from './types.ts'
