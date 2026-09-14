import type { Box } from './box'
import type { Props } from './props'

/** Component props type alias – extracts props from a component type. */
export type ComponentProps<T> = T

/** Interface with multiple type parameters. */
export interface WithGenerics<T, U> {
  /** First generic field. */
  a: T
  /** Second generic field. */
  b: U
}

/** Uses a type reference with type arguments: Props<Box<string>>. */
export interface UsesGenericRef {
  /** The wrapped Props<Box<string>> instance. */
  item: Props<Box<string>>
}
