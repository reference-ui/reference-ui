/**
 * Core advanced generic pattern definitions.
 */

/** Complex generic defaults with multiple type parameters and constraints. */
export type GenericDefaultsComplex<
  T = Record<string, unknown>,
  K extends keyof T = keyof T,
> = {
  data: T
  key: K
  value: T[K]
}

/** Generic constraint using extends keyword. */
export type GenericConstraintsExtends<T extends { id: string }> = {
  entity: T
  id: T['id']
}

/** Generic inference using infer keyword. */
export type GenericInfer<T> = T extends Promise<infer U> ? U : T

/** Higher-kinded type pattern simulation. */
export type GenericHigherKinded<F extends { _: unknown }, A> = F & { _: A } extends {
  output: infer U
}
  ? U
  : never

/** Recursive generic type definition. */
export type GenericRecursive<T> = {
  [K in keyof T]?: GenericRecursive<T[K]>
}

/** Distributive conditional type over unions. */
export type GenericDistributiveConditional<T> = T extends null | undefined ? never : T

/** Variadic tuple manipulation. */
export type GenericVariadicTuples<A extends any[], B extends any[]> = [...A, ...B]
