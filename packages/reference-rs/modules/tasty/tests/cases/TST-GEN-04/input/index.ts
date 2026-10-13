export type A = { top: string }

export type Two<A, B = A> = { first: A; second: B }

export type UseTwo = Two<number>

export type Two2<A = string, B = A> = { first: A; second: B }

export type UseTwoBare = Two2

export type Nest<A, B = { inner: A }> = { value: B }

export type UseNest = Nest<string>
