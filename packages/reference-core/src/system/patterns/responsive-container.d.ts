/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index'
import type { Properties } from '../types/csstype'
import type { SystemProperties } from '../types/style-props'
import type { DistributiveOmit } from '../types/system-types'
import type { Tokens } from '../tokens/index'

export interface ResponsiveContainerProperties {
  r?: ConditionalValue<object>
  container?: ConditionalValue<string>
}

interface ResponsiveContainerStyles
  extends
    ResponsiveContainerProperties,
    DistributiveOmit<SystemStyleObject, keyof ResponsiveContainerProperties | 'r'> {}

interface ResponsiveContainerPatternFn {
  (styles?: ResponsiveContainerStyles): string
  raw: (styles?: ResponsiveContainerStyles) => SystemStyleObject
}

export declare const responsiveContainer: ResponsiveContainerPatternFn
