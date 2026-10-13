export interface UserT {
  id: string
}

export interface Wrap<T> {
  inner: T
}

export interface ArrHeir extends Array<UserT> {}

export interface ArrNested extends Array<Wrap<UserT>> {}
