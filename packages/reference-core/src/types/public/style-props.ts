import type { ReferenceProps } from './props'
import type { SystemStyleObject } from './system-style-object'

/**
 * Public style props for React primitives.
 *
 * Color narrowing is not repeated here. The packager wraps
 * `BaseSystemStyleObject` with `StrictColorProps` in generated
 * `system-style-object.d.ts` when `ui.config.ts` sets `strict: ['colors', …]`.
 * This source file always omits dialect keys and adds `ReferenceProps`.
 *
 * This type only omits `font` | `weight` | `container` | `r` (primitives own those via
 * `font` / `container` / `r`) and adds `ReferenceProps`.
 *
 * @example `<Div fontSize="lg" container="center" />`
 *
 * Declared as a `type` alias (not `interface`) so Tasty indexes it as `typeAlias` and the
 * reference manifest does not try to resolve built-ins like `Omit` as named symbols.
 */
export type StyleProps = Omit<SystemStyleObject, 'font' | 'weight' | 'container' | 'r'> &
  ReferenceProps
