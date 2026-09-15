/**
 * Owned `recipe()` / `cva()` contracts.
 *
 * Public authored types live here. Panda's generated `cva` stays the runtime
 * backend; `customCvaFn` casts a `RecipeDefinition` into that backend. Style
 * values are `SystemStyleObject` from `./system-style-object`.
 */
import type { SystemStyleObject } from './system-style-object'

type StringToBoolean<T> = T extends 'true' | 'false' ? boolean : T

type OneOrMore<T> = T | T[]

/**
 * Variant table: axis → value → styles. A string index (the unconstrained
 * default) collapses `RecipeSelection` to `{}` so `RecipeVariantProps<typeof
 * recipeFn>` still accepts a specific runtime function.
 */
type RecipeVariantRecord = Record<string, Record<string, SystemStyleObject>>

export type RecipeSelection<T extends RecipeVariantRecord = RecipeVariantRecord> =
  string extends keyof T
    ? {}
    : {
        [K in keyof T]?: StringToBoolean<keyof T[K]> | undefined
      }

type RecipeCompoundSelection<T extends RecipeVariantRecord> = string extends keyof T
  ? { css: SystemStyleObject }
  : {
      [K in keyof T]?: OneOrMore<StringToBoolean<keyof T[K]>> | undefined
    } & { css: SystemStyleObject }

export interface RecipeDefinition<T extends RecipeVariantRecord = RecipeVariantRecord> {
  base?: SystemStyleObject
  variants?: T
  defaultVariants?: RecipeSelection<T>
  compoundVariants?: Array<RecipeCompoundSelection<T>>
}

type RecipeVariantFn<T extends RecipeVariantRecord = RecipeVariantRecord> = (
  props?: RecipeSelection<T>,
) => string

export interface RecipeRuntimeFn<T extends RecipeVariantRecord = RecipeVariantRecord>
  extends RecipeVariantFn<T> {
  raw: (props?: RecipeSelection<T>) => SystemStyleObject
  variantKeys: Array<keyof T>
  variantMap: { [K in keyof T]: Array<keyof T[K]> }
  splitVariantProps<Props extends RecipeSelection<T>>(
    props: Props,
  ): [RecipeSelection<T>, Omit<Props, keyof T>]
}

export interface RecipeCreatorFn {
  <T extends RecipeVariantRecord>(config: RecipeDefinition<T>): RecipeRuntimeFn<T>
}

export type RecipeVariantProps<T extends RecipeVariantFn> = Parameters<T>[0]

export type RecipeVariant<T extends RecipeVariantFn> = Exclude<
  Required<RecipeVariantProps<T>>,
  undefined
>
