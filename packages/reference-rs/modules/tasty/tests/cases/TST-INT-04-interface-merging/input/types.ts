/**
 * Same-file declaration merging: two `export interface Widget` blocks are
 * one type under tsc, with the union of members. The resolve layer folds
 * them into a single symbol (M1) instead of letting the id-keyed maps
 * silently keep only the last block.
 */

export interface Widget {
  alpha: string
}

export interface Widget {
  beta: number
}
