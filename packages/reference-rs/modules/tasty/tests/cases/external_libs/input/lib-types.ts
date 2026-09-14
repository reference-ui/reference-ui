/**
 * Re-export library types so the scanner follows and documents them.
 * Without these re-exports we would not pull in node_modules for these packages.
 */
export type { Properties as CSSProperties } from 'csstype'
export type { JSONSchema4 } from 'json-schema'
