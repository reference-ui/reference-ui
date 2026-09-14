/**
 * Interface heritage with TypeScript utility types: oxc splits `extends Omit<...>`
 * into an expression (`Omit`) plus `type_arguments`. The scanner must preserve
 * those arguments so the runtime can project members without loading a symbol `Omit`.
 */

export interface SystemLike {
  font: string
  weight: number
  keep: boolean
}

/** Mirrors `StyleProps extends Omit<SystemStyleObject, 'font' | ...>` style APIs. */
export interface StyleProps extends Omit<SystemLike, 'font' | 'weight'> {
  extra?: string
}

export interface ChildProps extends StyleProps {
  childOnly?: number
}
