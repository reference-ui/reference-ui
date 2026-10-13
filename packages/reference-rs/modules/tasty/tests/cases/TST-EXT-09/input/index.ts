export interface Holder<A> {
  keep: A
  run<A>(input: A): A
}

export interface UseHolder extends Holder<number> {}

export type Box<A> = {
  keep: A
  run<A>(input: A): A
}

export interface UseBox extends Box<number> {}
