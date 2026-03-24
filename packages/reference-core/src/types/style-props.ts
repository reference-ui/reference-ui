import type { ReferenceProps } from './props'
import type { SystemStyleObject } from './system-style-object'

/**
 * Public style props for React primitives.
 * Composes the authored style object with `ReferenceProps` (font, container, `r`, ...).
 * Use for direct primitive props like <Div fontSize="lg" container="center" />
 */
export type StyleProps = SystemStyleObject & ReferenceProps

