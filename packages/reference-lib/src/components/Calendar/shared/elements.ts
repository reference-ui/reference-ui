/**
 * Element-slot plumbing: isPartElement detects a direct part element for
 * per-part defaulting, and describeRendererNode names a received value for
 * the Days renderer diagnostics. Both take unknowns because authored
 * children and renderer returns are runtime-validated.
 */
import * as React from 'react'

export function isPartElement(
  node: React.ReactNode,
  part: unknown
): node is React.ReactElement {
  return React.isValidElement(node) && node.type === part
}

export function describeRendererNode(node: unknown): string {
  if (node === null || node === undefined || node === false) return 'no element'
  if (Array.isArray(node)) return `an array of ${node.length} nodes`
  if (React.isValidElement(node)) {
    const type = node.type as string | { displayName?: string; name?: string }
    if (type === React.Fragment) return 'a Fragment'
    if (typeof type === 'string') return `a native <${type}>`
    return `a <${type.displayName ?? type.name ?? 'Component'}>`
  }
  return `a ${typeof node}`
}
