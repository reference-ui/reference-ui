/**
 * Interface heritage using built-in utility types (`extends Omit<…>`, `extends Pick<…>`, etc.).
 * oxc splits `extends Foo<…>` into expression + type arguments; Tasty preserves them for projection.
 */

// --- extends_omit ---
export interface BarOmit {
  x: string
  y: number
  keep: boolean
}
export interface ExtendsOmit extends Omit<BarOmit, 'x'> {}

// --- extends_pick ---
export interface BarPick {
  a: string
  b: number
  c: boolean
}
export interface ExtendsPick extends Pick<BarPick, 'a' | 'b'> {}

// --- extends_partial ---
export interface BarPartial {
  req: string
  opt?: number
}
export interface ExtendsPartial extends Partial<BarPartial> {}

// --- extends_required ---
export interface BarReq {
  a?: string
  b?: number
}
export interface ExtendsRequired extends Required<Partial<BarReq>> {}

// --- extends_record ---
export interface ExtendsRecord extends Record<string, unknown> {}

// --- extends_readonly ---
export interface BarReadonly {
  mut: string
  other: number
}
export interface ExtendsReadonly extends Readonly<BarReadonly> {}

// --- extends_multiple_utility ---
export interface AMulti {
  x: string
  y: number
}
export interface BMulti {
  y: number
  z: boolean
}
export interface ExtendsMultiple extends Omit<AMulti, 'x'>, Pick<BMulti, 'z'> {}

// --- extends_nested_utility ---
export interface BarNested {
  a: string
  b: number
  c: boolean
}
export interface ExtendsNested extends Omit<Pick<BarNested, 'a' | 'b'>, 'a'> {}

// --- extends_omit_union_keys ---
export interface BarUnion {
  x: string
  y: number
  z: boolean
  keep: string
}
export interface ExtendsOmitUnion extends Omit<BarUnion, 'x' | 'y' | 'z'> {}

// --- extends_omit_generic ---
export interface BarGen {
  a: string
  b: number
  c: boolean
}
export interface ExtendsOmitGeneric<K extends keyof BarGen> extends Omit<BarGen, K> {}
