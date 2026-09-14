/**
 * Core tuple and array type definitions.
 */

// Labeled tuple with named elements
export type TupleLabeled = [first: string, second: number, third: boolean]

// Tuple with optional elements
export type TupleOptional = [string, number?, boolean?]

// Tuple with rest element
export type TupleRest = [string, ...number[]]

// Readonly tuple
export type ReadonlyTuple = readonly [string, number]

// Const assertion pattern (simulated with readonly)
export type ConstAssertion = readonly ['users', 'posts', 'comments']

// Complex tuple combining multiple patterns
export type TupleComplex = [id: string, optional?: boolean, ...rest: number[]]

// Array to tuple conversion
export type ArrayToTuple<T extends readonly unknown[]> = T

// Tuple to array conversion
export type TupleToArray<T extends unknown[]> = T

// Tuple head extraction
export type TupleHead<T extends unknown[]> = T extends [infer H, ...unknown[]] ? H : never

// Tuple tail extraction
export type TupleTail<T extends unknown[]> = T extends [unknown, ...infer R] ? R : []
