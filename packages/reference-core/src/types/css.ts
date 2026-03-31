import type { SystemStyleObject } from './system-style-object'

export type CssStyles = SystemStyleObject | undefined | null | false

export interface CssRawFunction {
  (styles: CssStyles): SystemStyleObject
  (styles: CssStyles[]): SystemStyleObject
  (...styles: Array<CssStyles | CssStyles[]>): SystemStyleObject
  (styles: CssStyles): SystemStyleObject
}

export interface CssFunction {
  (styles: CssStyles): string
  (styles: CssStyles[]): string
  (...styles: Array<CssStyles | CssStyles[]>): string
  (styles: CssStyles): string

  raw: CssRawFunction
}
