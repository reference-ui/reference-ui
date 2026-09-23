// JSX runtime shim: it serves the react/jsx-runtime specifier the generated types bundle imports.
// Raw-browser worlds have no bundler to resolve that specifier, so the importmap points it here.
// The shim delegates to the generated react createElement, which is behavior-identical for rendered output.
import { createElement, Fragment } from '@reference-ui/react'
import type { ElementType } from 'react'

export { Fragment }

const createAnyElement = createElement as unknown as (type: unknown, config: unknown) => unknown

export function jsx(
  type: ElementType,
  props: Record<string, unknown> | null,
  key?: string | number
): unknown {
  if (key === undefined) return createAnyElement(type, props)
  return createAnyElement(type, { ...(props ?? {}), key })
}

export function jsxDEV(
  type: ElementType,
  props: Record<string, unknown> | null,
  key?: string | number
): unknown {
  return jsx(type, props, key)
}

export const jsxs = jsx
