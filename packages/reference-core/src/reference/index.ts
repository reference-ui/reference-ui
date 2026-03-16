/**
 * Docs-oriented reference primitives.
 * This module starts with API table definitions and can later grow into
 * normalization, rendering adapters, and Tasty-backed extraction.
 */
import { API } from './api'

export { defineReferenceTable } from './table'
export { API }
export { referenceTokens } from './tokens'
export type {
  ReferenceCell,
  ReferenceCellValue,
  ReferenceTable,
  ReferenceTableColumn,
  ReferenceTableRow,
} from './types'
export type { ReferenceApiProps } from './api'

export const Reference = {
  API,
} as const
