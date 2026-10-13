export interface Holder<A, B = A> {
  first: A
  second: B
}

export interface UseHolder extends Holder<number> {}

export interface Outer<T> extends Holder<T> {}

export interface UseOuter extends Outer<string> {}
