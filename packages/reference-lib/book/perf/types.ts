export interface BookPerfRecord {
  t: string
  file?: string
  deferred?: boolean
  fullReload?: boolean
  modules?: number
  syncMs?: number
  viteTransformMs?: number
  viteHmrMs?: number
  clientApplyMs?: number | null
  storyImportMs?: number | null
}

export interface BookStatusInfo {
  state: 'live' | 'updating' | 'error'
  label: string
  detail?: string
  lastCycleMs: number
  syncMs?: number
  viteHmrMs?: number
  clientApplyMs?: number
  storyImportMs?: number
  invalidatedModules?: number
  updatedAt: number
}
