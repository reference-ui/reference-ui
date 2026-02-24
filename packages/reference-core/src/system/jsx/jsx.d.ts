/* eslint-disable */
import type { FunctionComponent } from 'react'
import type { JsxProperties } from '../patterns/jsx'
import type { HTMLStyledProps } from '../types/jsx'
import type { DistributiveOmit } from '../types/system-types'

export interface JsxProps
  extends JsxProperties, DistributiveOmit<HTMLStyledProps<'div'>, keyof JsxProperties> {}

export declare const Jsx: FunctionComponent<JsxProps>
