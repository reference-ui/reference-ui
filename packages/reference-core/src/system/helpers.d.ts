/**
 * Type declarations for Panda codegen helpers.js
 */

export function compact<T extends Record<string, unknown>>(value: T | undefined): Partial<T>

export function createCss(context: {
  utility: { prefix?: string; toHash: (arr: unknown[], fn: (v: string) => string) => string; transform: (prop: string, value: string) => { className: string } }
  hash?: boolean
  conditions?: {
    shift: (paths: string[]) => string[]
    finalize: (paths: string[]) => string[]
    breakpoints: { keys: string[] }
  }
}): (styles?: { base?: object; [key: string]: unknown }) => string

export function createMergeCss(context: Parameters<typeof createCss>[0]): {
  mergeCss: (...styles: object[]) => object
  assignCss: (...styles: object[]) => object
}

export function filterBaseConditions(c: string[]): string[]

export function getPatternStyles(
  pattern: { defaultValues?: object | ((styles: object) => object) } | null | undefined,
  styles: object
): object

export function getSlotCompoundVariant<T>(compoundVariants: T[], slotName: string): T[]

export function getSlotRecipes(recipe?: {
  className?: string
  slots?: string[]
  base?: Record<string, object>
  variants?: Record<string, Record<string, object>>
  defaultVariants?: object
  compoundVariants?: Array<{ css: Record<string, object> }>
}): Record<string, unknown>

export const hypenateProperty: (property: string) => string

export function isBaseCondition(v: unknown): v is 'base'

export function isObject(value: unknown): value is Record<string, unknown>

export function mapObject<T, U>(obj: T | T[], fn: (value: T) => U): U | U[] | Record<string, U>

export function memo<T extends (...args: unknown[]) => unknown>(fn: T): T

export function mergeProps<T extends object>(...sources: (T | null | undefined)[]): T

export const patternFns: {
  map: typeof mapObject
  isCssFunction: (v: unknown) => boolean
  isCssVar: (v: unknown) => boolean
  isCssUnit: (v: unknown) => boolean
}

export function splitProps<T extends object, K extends (keyof T | (keyof T)[])[]>(
  props: T,
  ...keys: K
): { [I in keyof K]: I extends number ? Partial<T> : never } & [Partial<T>]

export function toHash(value: string): string

export function uniq<T>(...items: (T[] | null | undefined)[]): T[]

export function walkObject<T>(
  target: T,
  predicate: (value: unknown, path: string[]) => unknown,
  options?: { stop?: (value: unknown, path: string[]) => boolean; getKey?: (prop: string, child: unknown) => string }
): T

export function withoutSpace(str: string): string

export function normalizeHTMLProps(props: Record<string, unknown>): Record<string, unknown>
export namespace normalizeHTMLProps {
  const keys: string[]
}

export function __spreadValues<T extends object, U extends object>(a: T, b: U): T & U

export function __objRest<T extends object, K extends keyof T>(source: T, exclude: K[]): Omit<T, K>
