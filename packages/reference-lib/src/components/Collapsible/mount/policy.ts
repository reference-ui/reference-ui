/**
 * Mount policies: which closed content stays in the tree and why. The
 * Content prop wins over the root default for hidden-until-found, and
 * hidden-until-found wins over force-mount (hidden content must actually
 * hide); Presence keeps anything open, findable, or force-mounted, and a
 * `beforematch` reveal opens only a live, still-closed panel the consumer
 * did not cancel.
 */
export interface MountPolicyInput {
  contentProp: boolean | undefined
  rootDefault: boolean
  forceMount: boolean
}

export interface MountPolicy {
  untilFound: boolean
  forceMountAlone: boolean
}

export function resolveMountPolicy({
  contentProp,
  rootDefault,
  forceMount,
}: MountPolicyInput): MountPolicy {
  // CO-MOUNT: Content prop wins over the root default; untilFound wins
  // over forceMount (hidden-until-found content must actually hide).
  const untilFound = contentProp ?? rootDefault ?? false
  const forceMountAlone = forceMount && !untilFound
  return { untilFound, forceMountAlone }
}

export function resolvePresent({
  isOpen,
  untilFound,
  forceMount,
}: {
  isOpen: boolean
  untilFound: boolean
  forceMount: boolean
}): boolean {
  return isOpen || untilFound || forceMount
}

export function shouldRevealOnBeforeMatch({
  defaultPrevented,
  isConnected,
  isOpen,
}: {
  defaultPrevented: boolean
  isConnected: boolean
  isOpen: boolean
}): boolean {
  return !defaultPrevented && isConnected && !isOpen
}
