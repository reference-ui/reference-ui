export interface Base<T> {
  value: T
}

export interface Wrap<T> {
  inner: T
}

export interface UserT {
  id: string
}

export type AliasT = {
  name: string
}

export interface Direct extends Base<UserT> {}

export interface Aliased extends Base<AliasT> {}

export interface Nested extends Base<Wrap<UserT>> {}
