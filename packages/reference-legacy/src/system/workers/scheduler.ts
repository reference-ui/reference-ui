/**
 * Serialize Panda work inside the worker.
 *
 * Panda codegen and css-only runs both mutate the same generated artifact set
 * under one outDir, so overlapping runs can leave postprocess reading partial
 * or mixed files. This scheduler keeps one Panda run in flight, collapses
 * redundant watch triggers, and lets a queued codegen request outrank queued
 * css-only work.
 */

export type PandaRunKind = 'codegen' | 'css'

export type PandaRunScheduler = (kind: PandaRunKind) => void

export interface PandaRunSchedulerOptions {
  runners: Record<PandaRunKind, () => Promise<void>>
}

function mergePendingRun(
  current: PandaRunKind | null,
  next: PandaRunKind
): PandaRunKind {
  if (current === 'codegen' || next === 'codegen') return 'codegen'
  return 'css'
}

export function createPandaRunScheduler(
  options: PandaRunSchedulerOptions
): PandaRunScheduler {
  const { runners } = options
  let inFlight = false
  let pending: PandaRunKind | null = null

  const runQueued = async (initial: PandaRunKind) => {
    let next: PandaRunKind | null = initial

    while (next) {
      pending = null

      try {
        await runners[next]()
      } catch {
        // Panda handlers already log and emit failure events. Keep draining so
        // a newer queued run can recover the shared artifact set.
      }

      next = pending
    }

    inFlight = false
  }

  return (kind: PandaRunKind) => {
    if (inFlight) {
      pending = mergePendingRun(pending, kind)
      return
    }

    inFlight = true
    void runQueued(kind)
  }
}
