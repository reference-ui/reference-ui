// Measure tuning constants shared by the settle detector and the dirty poll.
// MEASUREMENT_SETTLE_TIMEOUT_MS is the quiet window before a layout sample counts as
// settled; MAX_IDLE_FRAMES is the unchanged frames before an opt-in poll sleeps.
/** Quiet window before a ResizeObserver/layout sample is treated as settled. */
export const MEASUREMENT_SETTLE_TIMEOUT_MS = 20

/** Consecutive unchanged frames before an opt-in rAF poll sleeps (~500ms at 60fps). */
export const MAX_IDLE_FRAMES = 30
