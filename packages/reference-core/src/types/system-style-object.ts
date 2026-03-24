import type { AnySelector, Selectors } from '@reference-ui/styled/types/selectors'
import type { CssVarProperties, SystemProperties } from '@reference-ui/styled/types/style-props'
import type { StyleConditionKey } from './conditions'
import type { StrictColorProps } from './colors'

type SystemStyleProperties = StrictColorProps<
  Omit<SystemProperties, 'font' | 'weight' | 'container' | 'r'>
> & CssVarProperties

type NestedStyleObject<P> = P & {
  [K in Selectors]?: NestedStyleObject<P>
} & {
  [K in AnySelector]?: NestedStyleObject<P>
} & {
  [K in StyleConditionKey]?: NestedStyleObject<P>
}

export type SystemStyleObject = NestedStyleObject<SystemStyleProperties>
