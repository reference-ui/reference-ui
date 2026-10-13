export interface Accessors {
  get value(): string
  set value(next: string)
}

export interface ReadOnlyAccessors {
  get id(): number
}

export interface WriteOnlyAccessors {
  set token(next: string)
}

export interface WithMethod {
  run(): void
}
