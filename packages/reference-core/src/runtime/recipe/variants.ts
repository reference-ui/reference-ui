// Variant metadata shared by the plain and slotted recipe resolvers.
// It takes one authored variants table and emits the variantKeys, variantMap and splitVariantProps helpers.
// Both resolvers attach the same helpers, so a slotted recipe reports every axis it was authored with.

import type { RecipeProps } from './types.ts'

/** The metadata half of a recipe fn: axis names, value names per axis, and the props splitter. */
export interface VariantHelpers {
  variantKeys: string[]
  variantMap: Record<string, string[]>
  splitVariantProps<P extends object>(props: P): [RecipeProps, Partial<P>]
}

/** Build the helpers for one authored variants table; an absent table has no axes. */
export function variantHelpers(
  variants: Record<string, Record<string, unknown>> | undefined
): VariantHelpers {
  const table = variants ?? {}
  const axes = Object.keys(table)
  return {
    variantKeys: axes,
    variantMap: Object.fromEntries(
      Object.entries(table).map(([axis, options]) => [axis, Object.keys(options)])
    ),
    splitVariantProps<P extends object>(props: P): [RecipeProps, Partial<P>] {
      const selection: RecipeProps = {}
      const rest: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(props)) {
        if (axes.includes(key)) selection[key] = value
        else rest[key] = value
      }
      return [selection, rest as Partial<P>]
    },
  }
}
