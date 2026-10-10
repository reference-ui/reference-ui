// @vitest-environment happy-dom
/** Isolated proof for slot/merge: the transparent-part merge layers part
 * props first with the authored child winning, combines className (compiled
 * css plus both sides), shallow-merges style child-wins, chains handlers
 * child/part/kernel with prevention gating, concatenates aria-describedby,
 * and applies kernel overrides last. The mounted end-to-end merge is also
 * covered by the component slot tests. */

import { describe, expect, it } from 'vitest'
import {
  ITEM_EXCLUDED_PROPS,
  ROOT_EXCLUDED_PROPS,
  concatDescribedBy,
  mergeSlotProps,
  type AnyProps,
} from './merge'

function merge(partProps: AnyProps, childProps: AnyProps, extra?: {
  exclude?: ReadonlySet<string>
  kernelHandlers?: Record<string, ((event: any) => void) | undefined>
  overrides?: AnyProps
}) {
  return mergeSlotProps({
    partProps,
    child: { props: childProps },
    exclude: extra?.exclude ?? new Set<string>(['children', 'ref']),
    kernelHandlers: extra?.kernelHandlers,
    overrides: extra?.overrides,
  })
}

describe('mergeSlotProps precedence', () => {
  it('lets child native props win while the part fills gaps', () => {
    const merged = merge(
      { title: 'part-title', 'data-part': 'yes' },
      { title: 'child-title' }
    )
    expect(merged['title']).toBe('child-title')
    expect(merged['data-part']).toBe('yes')
  })

  it('never spreads excluded part props onto the child', () => {
    const merged = merge(
      { orientation: 'vertical', loop: true, typeahead: true, id: 'kept' } as AnyProps,
      {},
      { exclude: ROOT_EXCLUDED_PROPS }
    )
    expect(merged).toEqual({ id: 'kept' })
    const itemMerged = merge(
      { id: 'x', disabled: true, textValue: 't', title: 'kept' } as AnyProps,
      {},
      { exclude: ITEM_EXCLUDED_PROPS }
    )
    expect(itemMerged).toEqual({ title: 'kept' })
  })

  it('drops children and ref from the child props', () => {
    const merged = merge({}, { children: 'x', ref: () => {} })
    expect(merged).toEqual({})
  })
})

describe('mergeSlotProps className and style', () => {
  it('combines compiled css, part, and child classNames', () => {
    const merged = merge(
      { css: { display: 'flex' }, className: 'part-class' },
      { className: 'child-class' }
    )
    const className = merged['className'] as string
    expect(className).toContain('reference-ui__')
    expect(className).toContain('part-class')
    expect(className).toContain('child-class')
  })

  it('merges style shallow with the child winning', () => {
    const merged = merge(
      { style: { color: 'red', marginTop: 4 } },
      { style: { color: 'blue' } }
    )
    expect(merged['style']).toEqual({ color: 'blue', marginTop: 4 })
  })

  it('passes single-sided style through untouched', () => {
    const childStyle = { color: 'blue' }
    expect(merge({}, { style: childStyle })['style']).toBe(childStyle)
  })
})

describe('mergeSlotProps handlers and describedby', () => {
  it('chains handlers child-first and gates on prevention', () => {
    const order: string[] = []
    const merged = merge(
      { onKeyDown: () => void order.push('part') },
      {
        onKeyDown: (e: { preventDefault: () => void }) => {
          order.push('child')
          e.preventDefault()
        },
      },
      { kernelHandlers: { onKeyDown: () => void order.push('kernel') } }
    )
    const onKeyDown = merged['onKeyDown'] as (e: unknown) => void
    onKeyDown({ defaultPrevented: false, preventDefault(this: { defaultPrevented: boolean }) { this.defaultPrevented = true } })
    expect(order).toEqual(['child'])
  })

  it('runs the kernel when nobody prevents', () => {
    const order: string[] = []
    const merged = merge(
      {},
      { onFocus: () => void order.push('child') },
      { kernelHandlers: { onFocus: () => void order.push('kernel') } }
    )
    ;(merged['onFocus'] as (e: unknown) => void)({ defaultPrevented: false })
    expect(order).toEqual(['child', 'kernel'])
  })

  it('concatenates aria-describedby child-first', () => {
    expect(concatDescribedBy('child-desc', 'part-desc')).toBe('child-desc part-desc')
    expect(concatDescribedBy(undefined, 'part-desc')).toBe('part-desc')
    expect(concatDescribedBy(undefined, undefined)).toBeUndefined()
    const merged = merge({ 'aria-describedby': 'part-desc' }, { 'aria-describedby': 'child-desc' })
    expect(merged['aria-describedby']).toBe('child-desc part-desc')
  })
})

describe('mergeSlotProps overrides', () => {
  it('applies kernel overrides last so tabIndex stays authoritative (RF-TAB-08)', () => {
    const merged = merge(
      { tabIndex: 2 },
      { tabIndex: 0 },
      { overrides: { tabIndex: -1 } }
    )
    expect(merged['tabIndex']).toBe(-1)
  })
})
