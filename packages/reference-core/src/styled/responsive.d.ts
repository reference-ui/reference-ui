import type { SystemStyleObject } from '../system/types/index.js'

export type ResponsiveBreakpoints = {
  [breakpoint: number]: SystemStyleObject
}

declare module '../system/patterns/box' {
  interface BoxProperties {
    r?: ResponsiveBreakpoints
    container?: string | boolean
  }
}
