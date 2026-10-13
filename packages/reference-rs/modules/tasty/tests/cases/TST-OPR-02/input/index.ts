/**
 * keyof over a plain interface, an interface that extends another, an index signature, and a call signature.
 */

export interface Base {
  a: string
}

export interface Child extends Base {
  b: number
}

export interface Dict {
  [key: string]: number
}

export interface WithCall {
  (): void
  c: boolean
}

export interface Plain {
  a: string
  b: number
}

export type ChildKeys = keyof Child

export type DictKeys = keyof Dict

export type CallKeys = keyof WithCall

export type PlainKeys = keyof Plain
