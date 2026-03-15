/**
 * Signatures scenario: readonly, method/call/index signatures, array/tuple/intersection types.
 * Used to test §4.2 (richer type refs) and §4.3 (member metadata).
 */

/** Props with a readonly id and optional mutable label. */
export interface ReadonlyProps {
  readonly id: string;
  label?: string;
}

/** Interface with a method signature (no implementation). */
export interface WithMethod {
  /** Returns the display name. */
  getName(): string;
}

/** Callable interface: () => number */
export interface Callable {
  (): number;
}

/** Object with an index signature for string keys. */
export interface StringMap {
  [key: string]: number;
}

/** Mix of property, readonly, and index. */
export interface MixedMembers {
  readonly version: number;
  name: string;
  [key: string]: string | number;
}

/** Type alias using array (T[]). */
export type StringArray = string[];

/** Type alias using Array<T>. */
export type NumberArray = Array<number>;

/** Tuple type. */
export type StringNumberPair = [string, number];

/** Intersection type. */
export type WithIdAndName = { id: string } & { name: string };

/** Nested: array of tuples. */
export type Pairs = [string, number][];

/** Named tuple (labels on elements). */
export type NamedPair = [name: string, age: number];

/** Tuple with optional trailing element. */
export type WithOptionalElement = [string, number?];

/** Tuple with rest element. */
export type WithRest = [string, ...number[]];

/** Interface with construct signature. */
export interface Constructible {
  /** Construct with a number. */
  new (value: number): { value: number };
}

/** Parenthesized type (should unwrap to string). */
export type ParenType = (string);
