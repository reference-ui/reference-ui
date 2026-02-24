/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { ContainerSetupProperties } from '../patterns/container-setup'
import type { HTMLStyledProps } from '../types/jsx'
import type { DistributiveOmit } from '../types/system-types'

export interface ContainerSetupProps
  extends
    ContainerSetupProperties,
    DistributiveOmit<
      HTMLStyledProps<'div'>,
      keyof ContainerSetupProperties | 'container'
    > {}

export declare const ContainerSetup: FunctionComponent<ContainerSetupProps>
