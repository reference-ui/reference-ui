/**
 * Type definitions for responsive container query patterns
 *
 * Box r and container props are defined in the Panda pattern config;
 * this file exports the ResponsiveBreakpoints type for explicit typing.
 */

import type { SystemStyleObject } from '../system/types/index.js'

/**
 * Responsive breakpoint map for container queries
 * Keys are min-width breakpoints in pixels
 * Values are style objects to apply at that breakpoint
 *
 * @example
 * r: {
 *   300: { padding: '4r' },
 *   500: { padding: '6r', backgroundColor: 'blue.100' }
 * }
 */
export type ResponsiveBreakpoints = {
  [breakpoint: number]: SystemStyleObject
}

/**
 * Augment Panda's BoxStyles with our responsive props
 */
declare module '../system/patterns/box' {
  interface BoxProperties {
    /**
     * Container query responsive styles.
     * Keys are min-width breakpoints in pixels.
     *
     * @example
     * r: {
     *   300: { padding: '4r' },
     *   500: { padding: '6r' }
     * }
     */
    r?: ResponsiveBreakpoints

    /**
     * Make this box a container (inline-size) for container queries.
     * - `container` or `container={true}` → anonymous container
     * - `container="sidebar"` → named container
     *
     * @example
     * container
     * container="sidebar"
     */
    container?: string | boolean
  }
}
