export const identity = <T,>(value: T): T => value

export type IdentityOfString = typeof identity<string>

export type IdentityPlain = typeof identity
