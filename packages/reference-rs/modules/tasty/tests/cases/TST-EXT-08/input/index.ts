export type Alias<A> = {
  a: A
  b: A[]
}

export interface UseAlias extends Alias<number> {}

export interface Outer<T> extends Alias<T> {}

export interface UseOuter extends Outer<string> {}
