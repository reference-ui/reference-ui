/**
 * Shared `size` semantics: one value expands to equal width and height.
 *
 * The box-pattern surface uses this directly with the raw value so Panda can
 * continue resolving width/height through its normal style pipeline. The custom
 * utility surface resolves rhythm units first and then reuses the same shape.
 */
export function sizeStyles(value: string | number): {
  width: string | number
  height: string | number
} {
  return {
    width: value,
    height: value,
  }
}