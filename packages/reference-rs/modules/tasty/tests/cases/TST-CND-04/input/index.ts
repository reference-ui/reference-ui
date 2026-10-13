/**
 * Recursive aliases that never settle. Each must end unresolved, not crash the native scan.
 */

/** Recurses with a growing argument through a generic check. */
export type Nest<T> = T extends 'x' ? 'y' : Nest<[T]>

/** The tuple-length counter. */
export type Repeat<T, N extends number, A extends unknown[] = []> = A['length'] extends N
  ? A
  : Repeat<T, N, [...A, T]>

/** A decidable check that never matches: each step is a tuple, which never equals 'end'. */
export type Chain<N> = N extends 'end' ? 'done' : Chain<[N]>

export type StartChain = Chain<'x'>

/** Grows a literal by one character per step and settles after ten steps. */
export type Grow<S extends string> = S extends 'aaaaaaaaaa' ? 'done' : Grow<`${S}a`>

export type StartGrow = Grow<'a'>

/** A generic check: the growing template literal must not be expanded at declaration time. */
export type Grow2<T> = T extends 'aaaaaaaaaa' ? 'done' : Grow2<`${T}a`>

/** Nine binary parts: 512 members, under the union cap. */
export type Wide9 = `${'a' | 'b'}${'a' | 'b'}${'a' | 'b'}${'a' | 'b'}${'a' | 'b'}${'a' | 'b'}${'a' | 'b'}${'a' | 'b'}${'a' | 'b'}`

/** Eleven binary parts: 2048 members, past the union cap, so it fails closed. */
export type Wide11 = `${'a' | 'b'}${'a' | 'b'}${'a' | 'b'}${'a' | 'b'}${'a' | 'b'}${'a' | 'b'}${'a' | 'b'}${'a' | 'b'}${'a' | 'b'}${'a' | 'b'}${'a' | 'b'}`
