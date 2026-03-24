/**
 * Examples using tuple and array edge cases.
 */

import type {
  TupleLabeled,
  TupleOptional,
  TupleRest,
  ReadonlyTuple,
  ConstAssertion,
  TupleComplex,
  ArrayToTuple,
  TupleToArray,
  TupleHead,
  TupleTail,
} from './tuple-types'

// Labeled tuple example
export type LabeledExample = {
  coordinates: TupleLabeled
  getFirst: (tuple: TupleLabeled) => string
  getSecond: (tuple: TupleLabeled) => number
}

// Optional tuple elements example
export type OptionalExample = {
  flexible: TupleOptional
  hasOptional: (tuple: TupleOptional) => boolean
  getOptionalValue: (tuple: TupleOptional) => number | undefined
}

// Rest element example
export type RestExample = {
  variableLength: TupleRest
  getRest: (tuple: TupleRest) => number[]
  getFirst: (tuple: TupleRest) => string
}

// Readonly tuple example
export type ReadonlyExample = {
  immutable: ReadonlyTuple
  tryModify: (tuple: ReadonlyTuple) => never
  read: (tuple: ReadonlyTuple) => [string, number]
}

// Const assertion example
export type ConstExample = {
  literalStrings: ConstAssertion
  getFirst: (tuple: ConstAssertion) => 'users'
  getAll: (tuple: ConstAssertion) => readonly ['users', 'posts', 'comments']
}

// Complex tuple example
export type ComplexExample = {
  mixed: TupleComplex
  getId: (tuple: TupleComplex) => string
  getOptional: (tuple: TupleComplex) => boolean | undefined
  getRest: (tuple: TupleComplex) => number[]
}

// Conversion utilities example
export type ConversionExample = {
  arrayToTuple: ArrayToTuple<string[]>
  tupleToArray: TupleToArray<[number, boolean]>
  getHead: TupleHead<[string, number, boolean]>
  getTail: TupleTail<[string, number, boolean]>
}
