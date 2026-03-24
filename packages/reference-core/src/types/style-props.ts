import type { SystemStyleObject as StyledSystemStyleObject } from '@reference-ui/styled/types'
import type { StrictColorProps } from './colors'
import type { ReferenceProps } from './props'

/**
 * Backend-generated style object from the current styled-system implementation.
 * Keep this internal to Reference UI where possible so the public surface can
 * evolve without forcing a backend migration on users.
 */
type BackendSystemStyleObject = StyledSystemStyleObject

type ReferenceSystemStyleBase = StrictColorProps<Omit<
  StyledSystemStyleObject,
  'font' | 'weight' | 'container' | 'r'
>>

/**
 * Reference UI-owned style object.
 *
 * This is the public authored surface users should code against. Today it is
 * still backed by the generated styled-system types, but the alias belongs to
 * Reference UI rather than to the current extractor/compiler implementation.
 */
export type ReferenceSystemStyleObject = ReferenceSystemStyleBase & ReferenceProps

/**
 * Public style props for React primitives.
 * Use for direct primitive props like <Div fontSize="lg" container="center" />
 */
export type StyleProps = ReferenceSystemStyleObject

/**
 * Public style object used with the `css()` prop.
 */
export type SystemStyleObject = ReferenceSystemStyleObject

/**
 * Escape hatch for internal code that still needs the backend-generated shape.
 * Avoid exposing this type in user-facing APIs.
 */
export type { BackendSystemStyleObject }
