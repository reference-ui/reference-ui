/**
 * Authored variant of `./colors` for the strict-colors package configuration.
 *
 * When `ui.config.ts` opts into `strict: ['colors', ...]`, the packager selects
 * this module as the canonical source for `SystemStyleObject`'s color narrowing.
 * The shape mirrors `./colors` so consumers see the same exported names.
 */
export {
  COLOR_PROP_KEYS,
  type ColorPropKeys,
  type SafeColorProps,
  type StrictColorProps,
} from './colors'
