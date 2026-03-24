import type { SystemStyleObject } from './system-style-object'
import type { ReferenceProps } from './props'

/**
 * Public style props for React primitives.
 * Composes the authored style object with `ReferenceProps` (font, container, `r`, ...).
 * Use for direct primitive props like <Div fontSize="lg" container="center" />
 */
export interface StyleProps extends Omit<SystemStyleObject, 'font' | 'weight' | 'container' | 'r'>, ReferenceProps {}
