/**
 * Intersection types (`A & B`) and common merge patterns.
 * Projection walks each intersection arm and dedupes members by id (later arms win).
 */

// --- intersection_basic ---
export interface ABasic {
  a: string
  shared: number
}
export interface BBasic {
  b: boolean
  shared: number
}
export type MergedBasic = ABasic & BBasic

// --- intersection_with_override ---
export interface AOverride {
  field: number
  other: string
}
export type IntersectionOverride = AOverride & { field: string }

// --- intersection_utility_and_literal ---
export interface AUtil {
  x: string
  y: number
}
export type IntersectionUtilityLiteral = Omit<AUtil, 'x'> & { x: string }

// --- intersection_multiple ---
export interface A1 {
  a: string
}
export interface B1 {
  b: number
}
export interface C1 {
  c: boolean
}
export interface D1 {
  d: string
}
export type IntersectionMultiple = A1 & B1 & C1 & D1

// --- intersection_with_generics ---
export type Merge<T, U> = Omit<T, keyof U> & U

export interface FooG {
  id: string
  name: string
  extra: number
}
export interface BarG {
  name: number
  flag: boolean
}
/** Concrete instantiation of the generic merge helper. */
export type MergedGeneric = Merge<FooG, BarG>
