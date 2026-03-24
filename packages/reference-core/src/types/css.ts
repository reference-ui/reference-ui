import type { StrictColorProps } from './colors'
import type { SystemStyleObject } from './style-props'

export type CssStyles = StrictColorProps<SystemStyleObject> | undefined | null | false

export interface CssRawFunction {
  (styles: CssStyles): StrictColorProps<SystemStyleObject>
  (styles: CssStyles[]): StrictColorProps<SystemStyleObject>
  (...styles: Array<CssStyles | CssStyles[]>): StrictColorProps<SystemStyleObject>
  (styles: CssStyles): StrictColorProps<SystemStyleObject>
}

export interface CssFunction {
  (styles: CssStyles): string
  (styles: CssStyles[]): string
  (...styles: Array<CssStyles | CssStyles[]>): string
  (styles: CssStyles): string

  raw: CssRawFunction
}
