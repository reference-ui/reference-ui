import type { UtilityValues } from '@reference-ui/styled/types/prop-type'
import type { SystemProperties } from '@reference-ui/styled/types/style-props'
import type { StylePropValue } from './style-prop'

/**
 * Border-radius style props exposed on primitives and public style helpers.
 * These are prop keys, not radius values. We narrow their value domains
 * back to design tokens so arbitrary pixel/em values do not leak through
 * Panda's wider generated unions.
 *
 * Activated when `strict` includes `'radii'` in `ui.config.ts`.
 */
export const RADII_PROP_KEYS = [
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomRightRadius',
  'borderBottomLeftRadius',
  'rounded',
  'roundedTop',
  'roundedRight',
  'roundedBottom',
  'roundedLeft',
  'roundedTopLeft',
  'roundedTopRight',
  'roundedBottomRight',
  'roundedBottomLeft',
] as const satisfies readonly RadiiPropKeys[]

// Keep this as an explicit union so the reference pipeline can project
// `Omit<P, RadiiPropKeys>` instead of collapsing it to `typeof CONST[number]`.
export type RadiiPropKeys =
  | 'borderRadius'
  | 'borderTopLeftRadius'
  | 'borderTopRightRadius'
  | 'borderBottomRightRadius'
  | 'borderBottomLeftRadius'
  | 'rounded'
  | 'roundedTop'
  | 'roundedRight'
  | 'roundedBottom'
  | 'roundedLeft'
  | 'roundedTopLeft'
  | 'roundedTopRight'
  | 'roundedBottomRight'
  | 'roundedBottomLeft'

type PreferredRadiusUtilityKey = Extract<'borderRadius', keyof UtilityValues>

type RadiusToken = PreferredRadiusUtilityKey extends never
  ? never
  : UtilityValues[PreferredRadiusUtilityKey]

type StrictRadiusValue =
  | RadiusToken
  | 'none'
  | 'inherit'
  | 'initial'
  | 'revert'

export type SafeRadiiProps = {
  // Lock authored radii to design tokens; preserve a small set of CSS
  // reset/inheritance keywords so common escape hatches still type-check.
  [K in Extract<keyof SystemProperties, RadiiPropKeys>]?: StylePropValue<StrictRadiusValue>
}

export type StrictRadiiProps<P> = Omit<P, RadiiPropKeys> & SafeRadiiProps
