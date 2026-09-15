export type ConditionalValue<T> = T | { [breakpoint: string]: T }

export interface SystemProperties {
  color?: ConditionalValue<string>
  font?: ConditionalValue<string>
  weight?: ConditionalValue<string>
  container?: ConditionalValue<string>
  base?: ConditionalValue<string>
}

export type CssVarProperties = {
  '--accent'?: ConditionalValue<string>
}

export type Nested<P> =
  & P
  & {
    [selector: string]: Nested<P>
  }

export interface ReferenceContainerProps {
  container?: ConditionalValue<string>
}

export interface ReferenceResponsiveProps {
  r?: ConditionalValue<Record<string, SystemStyleObject>>
}

export type ReferenceFontProps = {
  font?: ConditionalValue<string>
  weight?: ConditionalValue<string>
}

export type ReferenceBoxPatternProps =
  & ReferenceContainerProps
  & ReferenceResponsiveProps
  & ReferenceFontProps

export type SystemStyleObject = Omit<Nested<SystemProperties & CssVarProperties>, 'base'>

export type ReferenceSystemStyleObject =
  & Omit<SystemStyleObject, 'font' | 'weight' | 'container' | 'r'>
  & ReferenceBoxPatternProps

export type PublicReferenceSystemStyleObject = ReferenceSystemStyleObject
