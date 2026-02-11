/**
 * Type declarations for Panda-generated system/helpers.js (no .d.ts emitted).
 * Keep here - do not add to system/ as it is generated.
 */
declare module '@reference-ui/core/system/helpers.js' {
  export function splitProps<T extends object>(
    props: T,
    ...keys: string[][]
  ): [Record<string, unknown>, ...Record<string, unknown>[]]
}
