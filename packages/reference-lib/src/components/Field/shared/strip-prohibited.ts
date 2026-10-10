/**
 * The runtime backstop behind Field's prop Omit: strips the role and validity
 * ARIA surface that must never reach the host, even from JS callers the
 * FieldProps type cannot stop. Takes the post-destructure props record and
 * returns a fresh record with only the six prohibited keys removed — every
 * other key, including data-* overrides, passes through untouched.
 */

const PROHIBITED_FIELD_KEYS = new Set([
  'role',
  'aria-invalid',
  'aria-disabled',
  'aria-readonly',
  'aria-required',
  'aria-errormessage',
])

export function stripProhibitedFieldProps(
  props: Record<string, unknown>
): Record<string, unknown> {
  const rest: Record<string, unknown> = {}
  for (const key of Object.keys(props)) {
    if (!PROHIBITED_FIELD_KEYS.has(key)) {
      rest[key] = props[key]
    }
  }
  return rest
}
