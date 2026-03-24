import type { SystemStyleObject as StyledSystemStyleObject } from '@reference-ui/styled/types'
import type { AnySelector, Selectors } from '@reference-ui/styled/types/selectors'
import type { FilteredConditionKey, StyleConditionKey } from './conditions'

type NarrowedSystemStyleObject = Omit<
  StyledSystemStyleObject,
  FilteredConditionKey
> & {
  [K in Selectors]?: NarrowedSystemStyleObject
} & {
  [K in AnySelector]?: NarrowedSystemStyleObject
} & {
  [K in StyleConditionKey]?: NarrowedSystemStyleObject
}

export type SystemStyleObject = NarrowedSystemStyleObject
