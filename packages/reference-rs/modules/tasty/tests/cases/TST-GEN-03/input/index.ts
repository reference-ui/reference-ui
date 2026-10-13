export interface Item {
  id: string
}

export interface Wrap<Item> {
  value: Item
}

export interface Holder {
  run<Item>(input: Item): Item
}

export type MakeItem = <Item>(value: Item) => Item

export interface U {
  tag: string
}

export type Flatten<T> = T extends Array<infer U> ? U : T

export interface UsesItem {
  item: Item
}

export interface Data {
  tag: string
}

export type Unwrap<T> = T extends { data: infer Data } ? Data : never

export type Keyed = { [Item in 'a' | 'b']: Item }
