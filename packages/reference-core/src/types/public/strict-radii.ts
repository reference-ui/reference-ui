/**
 * Authored variant of `./radii` for the strict-radii package configuration.
 *
 * When `ui.config.ts` opts into `strict: ['radii', ...]`, the packager selects
 * this module as the canonical source for `SystemStyleObject`'s radius narrowing.
 * The shape mirrors `./radii` so consumers see the same exported names.
 */
export {
  RADII_PROP_KEYS,
  type RadiiPropKeys,
  type SafeRadiiProps,
  type StrictRadiiProps,
} from './radii'
