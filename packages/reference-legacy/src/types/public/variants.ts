import type { PrimitiveTag } from './primitives'

/**
 * Default variant literals for standard primitives in Reference UI.
 */
export interface PrimitiveDefaultVariants {
  button: 'default' | 'primary' | 'ghost'
  input: 'outline' | 'filled' | 'flushed' | 'unstyled'
  textarea: 'outline' | 'filled' | 'flushed' | 'unstyled'
  select: 'outline' | 'filled'
  table: 'simple' | 'striped' | 'compact' | 'borderless'
  div: 'card' | 'well' | 'floating' | 'inset'
  span: 'badge' | 'pill'
  a: 'accent' | 'subtle' | 'muted'
  code: 'inline' | 'ghost' | 'outline'
  kbd: 'raised' | 'subtle'
  hr: 'subtle' | 'dashed' | 'bold'
}

/**
 * Global registry for primitive variant overrides.
 * Downstream packages (e.g. `@reference-ui/lib`) and user applications
 * augment this interface to define, customize, or override known variant literals.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PrimitiveVariantRegistry {}

/**
 * Resolves the variant union for a given primitive tag.
 * Prefers augmented variants from `PrimitiveVariantRegistry` if present,
 * falling back to `PrimitiveDefaultVariants`.
 * Uses `(string & {})` to provide instant IDE autocomplete for registered variants
 * while permitting arbitrary strings without type errors, unless in strict mode.
 */
export type PrimitiveVariantValue<T extends PrimitiveTag> =
  T extends keyof PrimitiveVariantRegistry
    ? PrimitiveVariantRegistry[T] | (string & {})
    : T extends keyof PrimitiveDefaultVariants
      ? PrimitiveDefaultVariants[T] | (string & {})
      : string
