/**
 * Aliased-host library fixture.
 * Exports baseSystem for downstream layers[] consumers (chain T16).
 *
 * Run `ref sync` in aliased-host-library before using.
 */
export { baseSystem } from '@reference-ui/system/baseSystem'
export { CheckBadge, CopyBadge } from './badges'
export type { BadgeShellProps } from './shell'
export {
  badgeShellCenter,
  badgeShellDisplayPattern,
  badgeShellFlexShrink,
  badgeShellLineHeight,
} from './tokens'
