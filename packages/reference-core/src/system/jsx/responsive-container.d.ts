/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { ResponsiveContainerProperties } from '../patterns/responsive-container'
import type { HTMLStyledProps } from '../types/jsx'
import type { DistributiveOmit } from '../types/system-types'

export interface ResponsiveContainerProps
  extends
    ResponsiveContainerProperties,
    DistributiveOmit<HTMLStyledProps<'div'>, keyof ResponsiveContainerProperties | 'r'> {}

export declare const ResponsiveContainer: FunctionComponent<ResponsiveContainerProps>
