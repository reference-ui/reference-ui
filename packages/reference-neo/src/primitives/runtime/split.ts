// Style prop splitting for Neo primitives over compiled prop names.
// It takes the artifact style prop list and emits a per-system splitter.
// Reserved keys (className, children, colorMode, variant, css, ref) never
// reach the DOM; known style props and condition arms (`_`, `&`, `@`
// prefixes, mirroring the engine's is_condition) resolve through css().
// Everything else passes through untouched, as core's split-props does
// without its Panda seam.

import type { SystemStyleObject } from '../../runtime/css/css.ts'

export interface SplitPrimitiveProps {
  className?: string
  children?: unknown
  colorMode?: unknown
  variant?: unknown
  cssProp?: SystemStyleObject
  ref?: unknown
  styleProps: SystemStyleObject
  elementProps: Record<string, unknown>
}

function isStyleObject(value: unknown): value is SystemStyleObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Condition arms ride to style resolution beside the compiled prop names.
 * The engine treats `_`, `&`, `@` prefixes as conditions (canon
 * is_condition); the splitter mirrors that lexical rule so `<Div
 * _hover={{…}} />` resolves instead of leaking onto the element.
 */
function isConditionProp(key: string): boolean {
  return key.startsWith('_') || key.startsWith('&') || key.startsWith('@')
}

/**
 * Build a prop splitter bound to one system's compiled style prop names.
 * Sync bakes the artifact list into the generated entry; unknown keys
 * always land on the element, never in the style resolution, except
 * condition arms (`_`, `&`, `@` prefixes) which resolve as whens.
 */
export function createPropSplitter(stylePropNames: readonly string[]) {
  const styleProps = new Set(stylePropNames)
  return function splitPrimitiveProps(
    props: Record<string, unknown>
  ): SplitPrimitiveProps {
    const { className, children, colorMode, variant, css, ref, ...rest } = props
    const resolved: SystemStyleObject = {}
    const elementProps: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(rest)) {
      if (styleProps.has(key) || isConditionProp(key)) resolved[key] = value
      else elementProps[key] = value
    }
    return {
      className: typeof className === 'string' ? className : undefined,
      children,
      colorMode,
      variant,
      cssProp: isStyleObject(css) ? css : undefined,
      ref,
      styleProps: resolved,
      elementProps,
    }
  }
}

export type PropSplitter = ReturnType<typeof createPropSplitter>
