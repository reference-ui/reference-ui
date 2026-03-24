import type { SystemStyleObject as StyledSystemStyleObject } from '@reference-ui/styled/types'
import type { StrictColorProps } from './colors'

/**
 * Panda-generated `SystemStyleObject` with {@link StrictColorProps} so color-bearing keys
 * use design tokens (and a small CSS keyword set), not arbitrary color strings.
 */
export type SystemStyleObject = StrictColorProps<StyledSystemStyleObject>
