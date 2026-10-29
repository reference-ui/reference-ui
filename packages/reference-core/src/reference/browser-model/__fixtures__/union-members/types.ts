// Union-members fixture types: a discriminated union of two object branches (one over a shared
// interface, one over named aliases), a literal discriminant, a member in one branch only, JSDoc on
// one branch only, and two unions that are not all object-like. The union-members test reads these.

export interface PickerShared {
  /** Visible label. */
  label: string
  size?: 'sm' | 'lg'
}

export type DayPicker = PickerShared & {
  /**
   * What a selection picks.
   * @default 'day'
   */
  mode?: 'day'
  value: string | null
  /** Called with the picked day. */
  onPick?: (value: string) => void
}

export type RangePicker = PickerShared & {
  mode: 'range'
  value: { start: string; end: string } | null
  onChange?: (value: { start: string; end: string }) => void
}

/** Branches are named aliases. */
export type PickerProps = DayPicker | RangePicker

/** Branches are inline intersections over one shared interface. */
export type InlinePickerProps =
  | (PickerShared & { kind: 'text'; text: string })
  | (PickerShared & { kind: 'icon'; icon: string })

/** Branches are bare object literals. */
export type LiteralUnion =
  | { kind: 'a'; /** The a payload. */ a: number }
  | { kind: 'b'; b: string }

/** A branch that is not an object type. */
export type MixedUnion = PickerShared | string

/** No object branch at all. */
export type PlainUnion = 'a' | 'b' | number

/** Branches that differ only in a function member type. */
export type MixedFunctions =
  | { onSelect?: (value: string) => void }
  | { onSelect?: (value: number) => void }
