import type { ReferenceProps } from './props';
import type { SystemStyleObject } from './system-style-object';
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
 *
 * Declared as a `type` alias (not `interface`) so Tasty indexes it as `typeAlias` and the
 * reference manifest does not try to resolve built-ins like `Omit` as named symbols.
 */
export type StyleProps = Omit<SystemStyleObject, 'font' | 'weight' | 'container' | 'r'> & ReferenceProps;
