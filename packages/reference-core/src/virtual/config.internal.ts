/**
 * Internal configuration constants for the virtual filesystem module.
 */

import { SYNC_OUTPUT_DIR_GLOB } from '../constants'

const TRANSFORM_EXTENSIONS_ENTRIES = [
  ['.mdx', '.jsx'],
  ['.js', '.js'],
  ['.jsx', '.jsx'],
  ['.ts', '.ts'],
  ['.tsx', '.tsx'],
] as const

export const TRANSFORM_EXTENSIONS = new Map(TRANSFORM_EXTENSIONS_ENTRIES)

export function isTransformExtension(ext: string): boolean {
  return TRANSFORM_EXTENSIONS.has(ext as (typeof TRANSFORM_EXTENSIONS_ENTRIES)[number][0])
}

export const TRANSFORMED_EXTENSIONS = [...new Set(TRANSFORM_EXTENSIONS.values())] as const

export const GLOB_CONFIG = {
  onlyFiles: true,
  absolute: true,
  ignore: ['**/node_modules/**', SYNC_OUTPUT_DIR_GLOB, '**/.git/**'],
} as const
