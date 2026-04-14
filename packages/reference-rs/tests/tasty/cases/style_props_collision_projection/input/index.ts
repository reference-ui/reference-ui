import type { StyleProps as ReactStyleProps } from './react-style'
import type { StyleProps as SystemStyleProps } from './system-style'

export type ExternalStylePropsTouch = ReactStyleProps | SystemStyleProps

export interface SystemStyleObject {
  display?: string
  color?: string
  font?: string
  weight?: string
  container?: string | boolean
  r?: Record<string, SystemStyleObject>
}

export interface ContainerProps {
  container?: string | boolean
}

export interface ResponsiveProps {
  r?: Record<string, SystemStyleObject>
}

export type FontProps = {
  font?: string
  weight?: string
}

export type ReferenceProps = ContainerProps & ResponsiveProps & FontProps

export type StyleProps = Omit<SystemStyleObject, 'font' | 'weight' | 'container' | 'r'> &
  ReferenceProps

export type PublicStyleProps = StyleProps

export interface UsesPublicStyleProps {
  style?: PublicStyleProps
}
