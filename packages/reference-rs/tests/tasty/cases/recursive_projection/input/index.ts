export interface BaseStyleProps {
  color?: string
  base?: string
}

export type CssVarProps = {
  '--accent'?: string
}

export type Nested<P> =
  & P
  & {
    [selector: string]: Nested<P>
  }

export type PatternProps = {
  gap?: string
}

export type SystemStyleObject =
  & Omit<Nested<BaseStyleProps & CssVarProps>, 'base'>
  & PatternProps

export type PublicSystemStyleObject = SystemStyleObject
