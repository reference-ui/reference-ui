/**
 * Icon props in the library: the props every Material Symbols icon takes.
 * It declares the same shape as `@reference-ui/icons` in the library's own files because the
 * icons package publishes its own bundled style system: indexed from there, the Reference docs
 * would list all ~1,370 style props, where this declaration builds on the library's `DivProps`
 * and lists only the props that matter. The assertion below fails the typecheck if `variant` or
 * `size` drift apart; the style props differ by environment (the icons build is unsynced), so
 * they are not compared.
 */
import type { DivProps } from '@reference-ui/react'
import type {
  IconSizeValue,
  IconVariant,
  MaterialSymbolIconProps as IconsPackageProps,
} from '@reference-ui/icons'

/** Props of every Material Symbols icon: the `div` props and style props, plus `variant` and `size`. */
export type MaterialSymbolIconProps = Omit<DivProps, 'size' | 'color'> & {
  /**
   * Glyph style.
   * @default 'outline'
   */
  variant?: IconVariant
  /**
   * Width and height. Numbers are pixels. `small`, `base` and `large` also work.
   * @default 'md'
   */
  size?: IconSizeValue
  /**
   * Glyph colour.
   * @default 'inherit'
   */
  color?: DivProps['color']
}

type IsSame<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
type Assert<T extends true> = T
type OwnProps = 'variant' | 'size'
export type IconOwnPropsMatchPackage = Assert<
  IsSame<Pick<MaterialSymbolIconProps, OwnProps>, Pick<IconsPackageProps, OwnProps>>
>
