// Resync scheduler for one watch session: it takes a resync function and
// emits schedule(), request(), and settle(). schedule() arms a trailing-edge
// timer that resets on every matched event, but the first schedule() of a
// burst also starts a max-wait clock that no reset can move past, so a steady
// stream of saves still resyncs. request() runs a pass now, and anything
// requested behind an in-flight pass costs exactly one follow-up pass, never
// a backlog. A failing pass goes to onError and the loop keeps going. A pass
// that never settles holds the passes behind it, so it is reported rather than
// hidden: a request that finds it past the stuck bound announces a stall, and
// settle() waits at most the shutdown bound before it gives the pass up.

export const RESYNC_SETTLE_MS = 60
export const RESYNC_MAX_WAIT_MS = 500
/** An in-flight pass older than this is stuck: a request that finds it announces a stuck stall. */
export const RESYNC_STUCK_MS = 5000
/** settle() waits at most this long for the in-flight pass before it abandons the pass. */
export const RESYNC_SHUTDOWN_SETTLE_MS = 3000

/** A pass the scheduler reports instead of waiting on. */
export interface ResyncStall {
  /** stuck: a request found the pass past the stuck bound. shutdown: settle() abandoned the pass. */
  kind: 'stuck' | 'shutdown'
  elapsedMs: number
}

export type ResyncStallListener = (stall: ResyncStall) => void

// Stalls are announced process-wide: one watch runs per CLI process, and the
// runner subscribes before it starts, so the runner can print each stall.
const stallListeners = new Set<ResyncStallListener>()

/** Subscribes to the stalls every scheduler in this process announces; returns the unsubscribe. */
export function onResyncStall(listener: ResyncStallListener): () => void {
  stallListeners.add(listener)
  return () => {
    stallListeners.delete(listener)
  }
}

function announceStall(stall: ResyncStall): void {
  for (const listener of stallListeners) listener(stall)
}

export interface ResyncScheduler {
  schedule(): void
  request(): void
  settle(): Promise<void>
}

export interface ResyncSchedulerOptions {
  /** Quiet time after the last schedule() before the timer fires. */
  settleMs?: number
  /** Longest one burst may defer its fire, counted from its first schedule(). */
  maxWaitMs?: number
  /** How long a pass may run before a request behind it reports it stuck. */
  stuckMs?: number
  /** How long settle() waits for the in-flight pass before it gives the pass up. */
  shutdownSettleMs?: number
  /**
   * Receives a rejected pass. The resync reports its own failures, so the
   * default drops this; it exists so one bad pass never stops the loop.
   */
  onError?: (error: unknown) => void
}

// Resolves true once the pending pass settles, false when the bound runs out
// first. A rejected pass has finished too, so it counts as settled.
function settlesWithin(pending: Promise<void>, ms: number): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), ms)
    const finish = (): void => {
      clearTimeout(timer)
      resolve(true)
    }
    pending.then(finish, finish)
  })
}

// The serial pass loop: at most one pass runs at a time, a request behind it
// queues exactly one follow-up, and settle() abandons a pass that outlives the
// shutdown bound instead of awaiting it forever.
interface PassLoop {
  request(): void
  settle(): Promise<void>
}

function createPassLoop(resync: () => Promise<void>, options: ResyncSchedulerOptions): PassLoop {
  const stuckMs = options.stuckMs ?? RESYNC_STUCK_MS
  const shutdownSettleMs = options.shutdownSettleMs ?? RESYNC_SHUTDOWN_SETTLE_MS
  const onError = options.onError ?? (() => {})
  let syncing = false
  let queued = false
  let cancelled = false
  let inFlight: Promise<void> | null = null
  let passStartedAt: number | null = null

  // A rejected pass is contained here so the loop survives it: a follow-up
  // queued behind the failure still runs instead of waiting for the next event.
  async function runPass(): Promise<void> {
    passStartedAt = Date.now()
    try {
      await resync()
    } catch (error) {
      onError(error)
    } finally {
      passStartedAt = null
    }
  }

  async function drain(): Promise<void> {
    syncing = true
    try {
      for (;;) {
        await runPass()
        if (!queued || cancelled) break
        queued = false
      }
    } finally {
      syncing = false
    }
  }

  // A request behind a pass past the stuck bound still queues, because the
  // pass may yet settle and a second pass must never run beside it. The stall
  // is announced so the save is never silently held behind it.
  function reportIfStuck(): void {
    if (passStartedAt === null) return
    const elapsedMs = Date.now() - passStartedAt
    if (elapsedMs >= stuckMs) announceStall({ kind: 'stuck', elapsedMs })
  }

  function request(): void {
    if (cancelled) return
    if (syncing) {
      reportIfStuck()
      queued = true
      return
    }
    inFlight = drain()
    void inFlight
  }

  // Settle stops the loop, then waits at most the shutdown bound for the pass
  // in flight. A pass that outlives the bound is abandoned, not awaited, so the
  // caller's stop() still reaches its release; the abandonment is announced.
  async function settle(): Promise<void> {
    cancelled = true
    const pending = inFlight
    if (pending === null) return
    const startedAt = passStartedAt
    if (await settlesWithin(pending, shutdownSettleMs)) return
    announceStall({ kind: 'shutdown', elapsedMs: startedAt === null ? 0 : Date.now() - startedAt })
  }

  return { request, settle }
}

export function createResyncScheduler(
  resync: () => Promise<void>,
  options: ResyncSchedulerOptions = {},
): ResyncScheduler {
  const settleMs = options.settleMs ?? RESYNC_SETTLE_MS
  const maxWaitMs = options.maxWaitMs ?? RESYNC_MAX_WAIT_MS
  const loop = createPassLoop(resync, options)
  let cancelled = false
  let timer: ReturnType<typeof setTimeout> | null = null
  let burstStart: number | null = null

  function fire(): void {
    timer = null
    burstStart = null
    loop.request()
  }

  function schedule(): void {
    if (cancelled) return
    const now = Date.now()
    if (burstStart === null) burstStart = now
    if (timer !== null) clearTimeout(timer)
    // The earlier of the quiet time and the burst deadline: a reset can
    // shorten the wait but never push the fire past first schedule plus max-wait.
    const deadline = burstStart + maxWaitMs
    timer = setTimeout(fire, Math.max(0, Math.min(settleMs, deadline - now)))
  }

  async function settle(): Promise<void> {
    cancelled = true
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
    await loop.settle()
  }

  return { schedule, request: loop.request, settle }
}
