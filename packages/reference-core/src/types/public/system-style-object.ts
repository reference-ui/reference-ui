import type { Properties } from 'csstype'
import type { StyleConditionKey } from './conditions'
import type { StylePropValue } from './style-prop'

/**
 * Reference UI's authored style object.
 *
 * Built from `csstype.Properties` mapped through `StylePropValue`, plus the
 * canon authoring aliases CSS does not spell (`bg`, `p`/`mt`, `w`/`h`,
 * `flexDir`). Nested condition keys and `&${string}` selectors recurse on this
 * type. The packager wraps `BaseSystemStyleObject` with `StrictColorProps` /
 * `StrictRadiiProps` when `ui.config.ts` sets `strict`; do not author that
 * wrapping here.
 *
 * `BaseSystemStyleObject` is an interface so `keyof` stays the named CSS
 * properties. A mapped-type alias intersected with `&${string}` collapses
 * `keyof` to `string` and strips native React handlers off primitives.
 */

type CssProperties = {
  [K in keyof Properties]?: StylePropValue<NonNullable<Properties[K]>>
}

type CanonAliasMap = {
  m: 'margin'
  mt: 'marginTop'
  mb: 'marginBottom'
  ml: 'marginLeft'
  mr: 'marginRight'
  mx: 'marginInline'
  my: 'marginBlock'
  p: 'padding'
  pt: 'paddingTop'
  pb: 'paddingBottom'
  pl: 'paddingLeft'
  pr: 'paddingRight'
  px: 'paddingInline'
  py: 'paddingBlock'
  w: 'width'
  h: 'height'
  minW: 'minWidth'
  minH: 'minHeight'
  maxW: 'maxWidth'
  maxH: 'maxHeight'
  bg: 'background'
  flexDir: 'flexDirection'
}

type CanonAliasOverlay = {
  [K in keyof CanonAliasMap]?: StylePropValue<
    NonNullable<Properties[CanonAliasMap[K]]>
  >
}

export interface BaseSystemStyleObject extends CssProperties, CanonAliasOverlay {}

export type SystemStyleObject = BaseSystemStyleObject & {
  [K in StyleConditionKey]?: SystemStyleObject
} & {
  [K in `&${string}`]?: SystemStyleObject
}
