import type { ReferenceProps } from './props'
import type { SystemStyleObject } from './system-style-object'

/**
 * Public style props for React primitives.
 *
 * Color narrowing is not repeated here: `SystemStyleObject` is already wrapped with
 * `StrictColorProps` in `./system-style-object` (see `./colors`), so token-safe colors
 * apply to `StyleProps` automatically.
 *
 * This type only omits `font` | `weight` | `container` | `r` (primitives own those via
 * `font` / `container` / `r`) and adds `ReferenceProps`.
 *
 * @example `<Div fontSize="lg" container="center" />`
 */
export interface StyleProps extends Omit<SystemStyleObject, 'font' | 'weight' | 'container' | 'r'>, ReferenceProps {}
