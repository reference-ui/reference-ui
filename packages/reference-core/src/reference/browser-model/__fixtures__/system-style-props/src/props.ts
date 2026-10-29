// Fixture for the system style-prop cases: an icon props alias built on a `DivProps` that a vendored
// `@reference-ui/sysrt` runtime copy spells out. It declares `variant` and its own `color`, which
// shares a name with a style prop, and omits `size`. It takes the runtime copy under node_modules
// and emits the alias the browser-model suite loads.

import type { DivProps } from '@reference-ui/sysrt'

/** Props of an icon: the div props, plus `variant` and its own `color`. */
export type IconProps = Omit<DivProps, 'size' | 'color'> & {
  /**
   * Glyph style.
   * @default 'outline'
   */
  variant?: 'outline' | 'filled'
  /** Glyph colour. */
  color?: string
}
