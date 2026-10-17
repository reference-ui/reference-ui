/** Transparent-part prop merge for the RovingFocus kernel.
 * `mergeSlotProps` layers the part props first and
 * lets the authored child win, except className (compiled `css` plus both
 * classNames combined), style (shallow-merged, child wins), event handlers
 * (child, then part, then kernel — each gated on defaultPrevented), and
 * aria-describedby (tokens concatenated). Kernel `overrides` apply last so
 * the kernel stays authoritative over Item tabIndex (RF-TAB-08). */

import { css } from '@reference-ui/react'
import { chainSlotHandlers, isHandlerKey, type AnyHandler } from '../shared/events'

export type AnyProps = Record<string, unknown>

export function concatDescribedBy(childValue: unknown, partValue: unknown): string | undefined {
  const tokens = `${childValue ?? ''} ${partValue ?? ''}`.trim().split(/\s+/).filter(Boolean)
  return tokens.length > 0 ? tokens.join(' ') : undefined
}

export function mergeSlotProps(options: {
  partProps: AnyProps
  child: { props?: any }
  exclude: ReadonlySet<string>
  kernelHandlers?: Record<string, AnyHandler | undefined>
  overrides?: AnyProps
}): AnyProps {
  const { partProps, child, exclude, kernelHandlers = {}, overrides = {} } = options
  const childProps = (child.props ?? {}) as AnyProps
  const merged: AnyProps = {}

  for (const key of Object.keys(partProps)) {
    if (exclude.has(key)) continue
    const value = partProps[key]
    if (isHandlerKey(key, value) || key in kernelHandlers || key === 'aria-describedby') continue
    merged[key] = value
  }
  for (const key of Object.keys(childProps)) {
    if (key === 'children' || key === 'ref') continue
    merged[key] = childProps[key]
  }

  const handlerKeys = new Set<string>(Object.keys(kernelHandlers))
  for (const key of [...Object.keys(partProps), ...Object.keys(childProps)]) {
    if (isHandlerKey(key, partProps[key]) || isHandlerKey(key, childProps[key])) {
      handlerKeys.add(key)
    }
  }
  for (const key of handlerKeys) {
    if (exclude.has(key)) continue
    const chained = chainSlotHandlers(childProps[key], partProps[key], kernelHandlers[key])
    if (chained) merged[key] = chained
    else delete merged[key]
  }

  if ('aria-describedby' in partProps || 'aria-describedby' in childProps) {
    const describedBy = concatDescribedBy(childProps['aria-describedby'], partProps['aria-describedby'])
    if (describedBy) merged['aria-describedby'] = describedBy
    else delete merged['aria-describedby']
  }

  const cssProp = partProps['css']
  const compiled = cssProp != null && typeof cssProp === 'object' ? css(cssProp as never) : ''
  const className = [compiled, partProps['className'], childProps['className']]
    .filter(c => typeof c === 'string' && c !== '')
    .join(' ')
  if (className !== '') merged['className'] = className
  else delete merged['className']

  const partStyle = partProps['style']
  const childStyle = childProps['style']
  if (
    partStyle != null &&
    typeof partStyle === 'object' &&
    childStyle != null &&
    typeof childStyle === 'object'
  ) {
    merged['style'] = { ...(partStyle as object), ...(childStyle as object) }
  }

  for (const key of Object.keys(overrides)) {
    merged[key] = overrides[key]
  }
  return merged
}

// Props consumed by the part itself; never spread onto the child.
export const ROOT_EXCLUDED_PROPS: ReadonlySet<string> = new Set([
  'children',
  'ref',
  'css',
  'className',
  'style',
  'orientation',
  'loop',
  'typeahead',
])

export const ITEM_EXCLUDED_PROPS: ReadonlySet<string> = new Set([
  'children',
  'ref',
  'css',
  'className',
  'style',
  'tabIndex',
  'id',
  'disabled',
  'textValue',
  'getNode',
])
