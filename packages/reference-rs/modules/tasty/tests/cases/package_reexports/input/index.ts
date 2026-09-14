import type { JSONSchema4 } from 'json-schema'
import type { Properties as CSSProperties } from 'csstype'

export type { JSONSchema4 } from 'json-schema'
export type { Properties as CSSProperties } from 'csstype'

export interface UsesExternalAliases {
  schema?: JSONSchema4
  css?: CSSProperties
}
