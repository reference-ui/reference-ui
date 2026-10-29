export interface Base {
  id: string
}

/** Alias comment that must stay on the alias. */
export type DialogProps = Base & {
  /**
   * Shown.
   * @default false
   */
  open?: boolean

  /** Fired on close. */
  onClose?: () => void

  bare?: string
}

/** Plain alias comment. */
export type Plain = {
  /** The label. */
  label: string

  count: number
}

export type Nested = {
  /** The outer box. */
  box: {
    /** Inner width. */
    width: number
    height: number
  }
}

/** Alias only. */
export type Undocumented = {
  first: string
  /** Second member. */
  second: number
}

/** Alias only, over an intersection. */
export type UndocumentedBox = Base & {
  first: string
}
