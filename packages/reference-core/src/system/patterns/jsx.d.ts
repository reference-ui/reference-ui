/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index'
import type { Properties } from '../types/csstype'
import type { SystemProperties } from '../types/style-props'
import type { DistributiveOmit } from '../types/system-types'
import type { Tokens } from '../tokens/index'

export interface JsxProperties {}

interface JsxStyles
  extends JsxProperties, DistributiveOmit<SystemStyleObject, keyof JsxProperties> {}

interface JsxPatternFn {
  (styles?: JsxStyles): string
  raw: (styles?: JsxStyles) => SystemStyleObject
}

export declare const jsx: JsxPatternFn
