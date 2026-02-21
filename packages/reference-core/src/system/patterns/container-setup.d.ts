/* eslint-disable */
import type { SystemStyleObject, ConditionalValue } from '../types/index'
import type { Properties } from '../types/csstype'
import type { SystemProperties } from '../types/style-props'
import type { DistributiveOmit } from '../types/system-types'
import type { Tokens } from '../tokens/index'

export interface ContainerSetupProperties {
  container?: ConditionalValue<string>
}

interface ContainerSetupStyles
  extends
    ContainerSetupProperties,
    DistributiveOmit<SystemStyleObject, keyof ContainerSetupProperties | 'container'> {}

interface ContainerSetupPatternFn {
  (styles?: ContainerSetupStyles): string
  raw: (styles?: ContainerSetupStyles) => SystemStyleObject
}

export declare const containerSetup: ContainerSetupPatternFn
