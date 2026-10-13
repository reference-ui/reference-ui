// Resync scheduler for one watch session: it takes a resync function and
// emits schedule(), request(), and settle(). schedule() arms a trailing-edge
// timer that resets on every matched event, but the first schedule() of a
// burst also starts a max-wait clock that no reset can move past, so a steady
// stream of saves still resyncs. request() runs a pass now, and anything
// requested behind an in-flight pass costs exactly one follow-up pass, never
// a backlog. A failing pass goes to onError and the loop keeps going, and
// settle() cancels the timer and drains the in-flight pass.

export const RESYNC_SETTLE_MS = 60
export const RESYNC_MAX_WAIT_MS = 500

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
  /**
   * Receives a rejected pass. The resync reports its own failures, so the
   * default drops this; it exists so one bad pass never stops the loop.
   */
  onError?: (error: unknown) => void
}

export function createResyncScheduler(
  resync: () => Promise<void>,
  options: ResyncSchedulerOptions = {},
): ResyncScheduler {
  const settleMs = options.settleMs ?? RESYNC_SETTLE_MS
  const maxWaitMs = options.maxWaitMs ?? RESYNC_MAX_WAIT_MS
  const onError = options.onError ?? (() => {})
  let syncing = false
  let queued = false
  let cancelled = false
  let timer: ReturnType<typeof setTimeout> | null = null
  let burstStart: number | null = null
  let inFlight: Promise<void> | null = null

  // A rejected pass is contained here so the loop survives it: a follow-up
  // queued behind the failure still runs instead of waiting for the next event.
  async function runPass(): Promise<void> {
    try {
      await resync()
    } catch (error) {
      onError(error)
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

  function request(): void {
    if (cancelled) return
    if (syncing) {
      queued = true
      return
    }
    inFlight = drain()
    void inFlight
  }

  function fire(): void {
    timer = null
    burstStart = null
    request()
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
    if (inFlight !== null) await inFlight.catch(() => {})
  }

  return { schedule, request, settle }
}
