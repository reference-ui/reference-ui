/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index'
import type { Properties } from '../types/csstype'
import type { SystemProperties } from '../types/style-props'
import type { DistributiveOmit } from '../types/system-types'
import type { Tokens } from '../tokens/index'

export interface FontPresetProperties {
  font?: ConditionalValue<string>
}

interface FontPresetStyles
  extends
    FontPresetProperties,
    DistributiveOmit<SystemStyleObject, keyof FontPresetProperties | 'font'> {}

interface FontPresetPatternFn {
  (styles?: FontPresetStyles): string
  raw: (styles?: FontPresetStyles) => SystemStyleObject
}

export declare const fontPreset: FontPresetPatternFn
