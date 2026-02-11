/** Type declarations for Panda-generated helpers.js (no .d.ts emitted). */
export function splitProps<T extends object>(
  props: T,
  ...keys: string[][]
): [Record<string, unknown>, ...Record<string, unknown>[]]
