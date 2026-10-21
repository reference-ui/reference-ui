// Interface and alias cycle: I extends A, and A intersects I.
export interface I extends A {
  i: 1
}
export type A = I & { a: 1 }

// The same cycle with type parameters bound through the extends clause.
export interface GI<T> extends GA<T> {
  i: T
}
export type GA<T> = GI<T> & { a: T }
export interface GU extends GI<string> {}

// A growing generic: each lap wraps the argument in Box again.
export type Box<T> = { v: T }
export interface G<T> extends H<Box<T>> {
  g: T
}
export type H<T> = G<T> & { h: T }
export interface U extends G<string> {}
