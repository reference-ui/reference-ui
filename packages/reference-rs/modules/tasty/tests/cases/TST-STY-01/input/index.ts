/**
 * Mirrors `reference-core` `StyleProps`:
 * `Omit<SystemStyleObject, 'font' | 'weight' | 'container' | 'r'> & ReferenceProps`
 *
 * If Tasty only projects the `ReferenceProps` branch, `getDisplayMembers` would miss
 * keys that exist only on the omitted base (e.g. `display`, `color`) — the Reference UI
 * bug where only container/r/font/weight appeared.
 */
export interface SystemStyleObjectCore {
  display?: string
  color?: string
  font?: string
  weight?: string
  container?: string | boolean
  r?: Record<string, SystemStyleObjectCore>
}

export interface ContainerPropsCore {
  container?: string | boolean
}

export interface ResponsivePropsCore {
  r?: Record<string, SystemStyleObjectCore>
}

export type FontPropsCore = {
  font?: string
  weight?: string
}

export type ReferencePropsCore = ContainerPropsCore & ResponsivePropsCore & FontPropsCore

/** Same structural idea as `packages/reference-core/src/types/style-props.ts` `StyleProps`. */
export type StylePropsCore = Omit<
  SystemStyleObjectCore,
  'font' | 'weight' | 'container' | 'r'
> &
  ReferencePropsCore
