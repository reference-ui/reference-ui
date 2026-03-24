export interface BaseStyleObject {
  color?: string
  padding?: string
  font?: string
  container?: string
  r?: Record<string, NarrowedStyleObject>
  base?: string
  sm?: string
  md?: string
}

type ViewportConditionKey = 'sm' | 'md'

export type FilteredConditionKey = 'base' | ViewportConditionKey

export type SelectorKey = '&:hover'

type NarrowedStyleObject =
  & Omit<BaseStyleObject, FilteredConditionKey>
  & {
    [K in SelectorKey]?: NarrowedStyleObject
  }

export interface ReferenceProps {
  container?: string | boolean
  r?: Record<string, NarrowedStyleObject>
}

export type PublicStyleProps =
  & Omit<NarrowedStyleObject, 'font' | 'container' | 'r'>
  & ReferenceProps
