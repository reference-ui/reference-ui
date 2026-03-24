/**
 * Concrete examples demonstrating the advanced generic patterns.
 */

import type {
  GenericDefaultsComplex,
  GenericConstraintsExtends,
  GenericInfer,
  GenericHigherKinded,
  GenericRecursive,
  GenericDistributiveConditional,
  GenericVariadicTuples,
} from './generic-patterns'

/** Example using generic defaults with union types. */
export type UnionWithDefaults = GenericDefaultsComplex<
  { name: string; age: number } | { id: string }
>

/** Example using constrained generics. */
export interface UserWithId {
  id: string
  name: string
}

export type ConstrainedWrapper = GenericConstraintsExtends<UserWithId>

/** Example using promise unwrapping. */
export type PromiseUnwrapper = GenericInfer<Promise<{ data: string[] }>>

/** Example using higher-kinded type simulation. */
export interface Box<T> {
  _: T
  output: T
}

export type HigherKindedExample = GenericHigherKinded<Box<string>, string>

/** Example using recursive deep partial. */
export interface ComplexObject {
  user: {
    profile: {
      name: string
      settings: {
        theme: string
        notifications: boolean
      }
    }
  }
}

export type DeepPartialExample = GenericRecursive<ComplexObject>

/** Example using distributive conditional over unions. */
export type NonNullableExample = GenericDistributiveConditional<
  string | null | undefined | number
>

/** Example using variadic tuple concatenation. */
export type TupleConcatExample = GenericVariadicTuples<
  [string, number],
  [boolean, symbol]
>
