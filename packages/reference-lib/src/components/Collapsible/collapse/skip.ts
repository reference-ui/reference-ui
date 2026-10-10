/**
 * Collapse-motion skip decisions: when the panel's height tween runs and
 * when it jumps. Force-mount-alone content never tweens — it keeps author
 * styles in both states — while hidden-until-found content shuts instantly
 * and only the armed skips (initial enter, one beforematch reveal) jump the
 * open.
 */
export interface CollapseSkipInput {
  skipEnterArmed: boolean
  skipOnceArmed: boolean
  isOpen: boolean
  untilFound: boolean
  forceMountAlone: boolean
}

export interface CollapseSkip {
  animate: boolean
  skip: boolean
}

export function resolveCollapseSkip({
  skipEnterArmed,
  skipOnceArmed,
  isOpen,
  untilFound,
  forceMountAlone,
}: CollapseSkipInput): CollapseSkip {
  // CO-MOUNT: forceMount-alone content keeps author styles in both
  // states — no collapse tween and no instant restyle, open or closed.
  if (forceMountAlone) return { animate: false, skip: false }

  const skipEnter = skipEnterArmed && isOpen
  const skipOnce = skipOnceArmed && isOpen

  // CO-MOUNT: hidden-until-found content shuts instantly (its boxes
  // are rendering-skipped either way); the open reveal tweens unless skipped.
  const skip = Boolean(skipEnter || skipOnce || (!isOpen && untilFound))
  return { animate: true, skip }
}
