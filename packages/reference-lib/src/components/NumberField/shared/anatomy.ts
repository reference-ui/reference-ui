/**
 * Direct-anatomy element guard: true when a child node is one of the
 * field's named parts. The Group counts direct parts with it, the root
 * scans for the explicit Input id and validates its single Group, and
 * nested extras fall through to the registration registry instead.
 */
import * as React from 'react'

export function isNumberFieldPart(
  node: React.ReactNode,
  part: unknown
): node is React.ReactElement<Record<string, unknown>> {
  return React.isValidElement(node) && node.type === part
}
