/**
 * Reference's public props. They mirror the `ReferenceComponentProps` contract that
 * `@reference-ui/types` declares, written out here so the library's own Reference docs can
 * index them: a type re-exported from another package is not indexed. The assertion below
 * fails the typecheck if the two shapes drift apart.
 */
import type { ReferenceComponentProps as CoreReferenceComponentProps } from '@reference-ui/types'

/** Props for the `Reference` documentation component. */
export interface ReferenceComponentProps {
  /** The type's name. */
  name: string
  /**
   * Heading level of the document title, so it nests under the page's own headings: pass `4`
   * when the block sits under an `h3`. Changes the element only; the title's size stays the same.
   * @default 2
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6
}

type IsSame<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
type Assert<T extends true> = T
export type ReferencePropsMatchCore = Assert<IsSame<ReferenceComponentProps, CoreReferenceComponentProps>>
