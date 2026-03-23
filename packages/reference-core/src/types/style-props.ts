import type { SystemStyleObject as StyledSystemStyleObject } from '../system/styled/types'
import type { ReferenceProps } from './props'

/**
 * Public style authoring surface owned by `reference-ui`.
 * Composes the backend style object with `ReferenceProps` (font, container, `r`, …).
 */
export type SystemStyleObject = Omit<
  StyledSystemStyleObject,
  'font' | 'weight' | 'container' | 'r'
> &
  ReferenceProps
