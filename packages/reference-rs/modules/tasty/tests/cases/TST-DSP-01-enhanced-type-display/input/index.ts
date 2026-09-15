export type ConditionalValue<T> = T | { [breakpoint: string]: T }

export interface SystemProperties {
  color?: ConditionalValue<string>
  font?: ConditionalValue<string>
  weight?: ConditionalValue<string>
  container?: ConditionalValue<string>
  base?: ConditionalValue<string>
}

export interface ThemeConfig {
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
  breakpoints: {
    mobile: string
    tablet: string
    desktop: string
  }
}

export interface StylePropValue<T> {
  value?: T
  theme?: T
  responsive?: Record<string, T>
}

export interface SystemStyleObject {
  color?: ConditionalValue<string>
  font?: ConditionalValue<string>
  weight?: ConditionalValue<string>
  container?: ConditionalValue<string>
  base?: ConditionalValue<string>
  theme?: ThemeConfig
}

export interface ReferenceContainerProps {
  container?: StylePropValue<string | boolean>
}

export interface ReferenceResponsiveProps {
  r?: StylePropValue<Record<string, SystemStyleObject>>
}

export interface ReferenceComplexProps {
  complexStyle?: StylePropValue<{
    color: string
    backgroundColor: string
    padding: string
    margin: string
    borderRadius: string
  }>
}

export interface NestedStyleProps {
  theme?: ThemeConfig
  styles?: {
    primary: SystemStyleObject
    secondary: SystemStyleObject
  }
}

export type StyleProps = 
  & Omit<SystemStyleObject, 'font' | 'weight' | 'container' | 'r'>
  & ReferenceContainerProps
  & ReferenceResponsiveProps
  & ReferenceComplexProps
