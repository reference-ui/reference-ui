export type ReferenceCellValue =
  | string
  | number
  | boolean
  | null
  | ReferenceCell

export interface ReferenceCell {
  text: string
  href?: string
  title?: string
  code?: boolean
}

export interface ReferenceTableColumn {
  key: string
  label: string
  description?: string
}

export type ReferenceTableRow = Record<string, ReferenceCellValue>

export interface ReferenceTable {
  kind: 'api-table'
  id: string
  title: string
  description?: string
  columns: readonly ReferenceTableColumn[]
  rows: readonly ReferenceTableRow[]
}
