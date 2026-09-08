import * as React from 'react'
import type { BookPerfRecord, BookStatusInfo } from './types'

let currentStatus: BookStatusInfo = {
  state: 'live',
  label: 'Live',
  lastCycleMs: 0,
  updatedAt: Date.now(),
}

const listeners = new Set<(status: BookStatusInfo) => void>()

function updateStatus(newStatus: Partial<BookStatusInfo>) {
  currentStatus = { ...currentStatus, ...newStatus, updatedAt: Date.now() }

  // Mirror onto html element for Playwright capture waiting
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-book-ready', currentStatus.state)
  }

  for (const listener of listeners) {
    try {
      listener(currentStatus)
    } catch {
      // ignore
    }
  }
}

// Attach Vite HMR and custom perf event listeners
if (typeof window !== 'undefined' && import.meta.hot) {
  let hmrStartTime = 0

  import.meta.hot.on('vite:beforeUpdate', () => {
    hmrStartTime = performance.now()
    updateStatus({
      state: 'updating',
      label: 'Updating…',
    })
  })

  import.meta.hot.on('vite:afterUpdate', (payload: any) => {
    const applyDuration = Math.round(performance.now() - hmrStartTime)
    const storyImport = (window as any).__BOOK_LAST_STORY_IMPORT_MS__ || 0

    const totalMs = applyDuration || storyImport || 25
    updateStatus({
      state: 'live',
      label: `Live · ${totalMs}ms`,
      lastCycleMs: totalMs,
      clientApplyMs: applyDuration,
      invalidatedModules: payload?.updates?.length || 1,
    })

    // Notify Vite server of client-side apply duration
    import.meta.hot?.send('book:client-perf', {
      clientApplyMs: applyDuration,
      storyImportMs: storyImport,
      modules: payload?.updates?.length || 1,
    })
  })

  import.meta.hot.on('book:perf', (record: BookPerfRecord) => {
    if (record.deferred) {
      updateStatus({
        state: 'updating',
        label: `Updating · sync ${record.syncMs ? `${record.syncMs}ms` : ''}`,
        syncMs: record.syncMs,
        viteHmrMs: record.viteHmrMs,
      })
    }
  })
}

export function setStoryLoadMetrics(storyImportMs: number) {
  updateStatus({
    state: 'live',
    label: `Live · ${storyImportMs}ms`,
    lastCycleMs: storyImportMs,
    storyImportMs,
  })
}

export function setBookErrorState(errorText: string) {
  updateStatus({
    state: 'error',
    label: 'Story error',
    detail: errorText,
  })
}

export function setBookUpdatingState(reason = 'Updating…') {
  updateStatus({
    state: 'updating',
    label: reason,
  })
}

export function useBookStatus(): BookStatusInfo {
  const [status, setStatus] = React.useState<BookStatusInfo>(currentStatus)

  React.useEffect(() => {
    listeners.add(setStatus)
    return () => {
      listeners.delete(setStatus)
    }
  }, [])

  return status
}
