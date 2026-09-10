/** Quiet window before a ResizeObserver/layout sample is treated as settled. */
export const MEASUREMENT_SETTLE_TIMEOUT_MS = 20

/** Consecutive unchanged frames before an opt-in rAF poll sleeps (~500ms at 60fps). */
export const MAX_IDLE_FRAMES = 30
