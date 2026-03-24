import type { SystemStyleObject as StyledSystemStyleObject } from '@reference-ui/styled/types'
import type { StrictColorProps } from './colors'
import type { ReferenceProps } from './props'

/**
 * Public style props for React primitives.
 * Composes the raw Panda style object with `ReferenceProps` (font, container, `r`, …).
 * Use for direct primitive props like <Div fontSize="lg" container="center" />
 */
export type StyleProps = StrictColorProps<Omit<
  StyledSystemStyleObject,
  'font' | 'weight' | 'container' | 'r'
>> &
  ReferenceProps

/**
 * Raw Panda SystemStyleObject.
 * Use only with the `css()` prop: <Div css={{ padding: '4r', bg: 'blue.500' }} />
 */
export type { SystemStyleObject } from '@reference-ui/styled/types'
