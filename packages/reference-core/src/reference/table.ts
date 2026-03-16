import type { ReferenceTable } from './types'

/**
 * Small identity helper for authoring reference table definitions.
 * We can add validation here later without changing call sites.
 */
export function defineReferenceTable<T extends ReferenceTable>(table: T): T {
  return table
}
