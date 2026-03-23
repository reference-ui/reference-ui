import type { FontProps } from './fonts'
import type { StylePropValue } from './style-prop'
import type { SystemStyleObject } from './style-props'

/**
 * Theme scope for token resolution.
 * Supported on HTML primitives only and emitted through the runtime theme
 * scoping attribute rather than the style object itself.
 */
export interface ColorModeProps {
  colorMode?: StylePropValue<string>
}

export interface ContainerProps {
  container?: StylePropValue<string | boolean>
}

export interface ResponsiveProps {
  r?: StylePropValue<Record<string | number, SystemStyleObject>>
}

/**
 * Higher-level props layered on top of the base style object (font, container,
 * responsive `r`, …). Part of the public `reference-ui` surface.
 */
export type ReferenceProps =
  & ContainerProps
  & ResponsiveProps
  & FontProps
