import * as React from 'react'
import { describe, expectTypeOf, it } from 'vitest'
import {
  RovingFocus,
  type RovingFocusItemProps,
  type RovingFocusOrientation,
  type RovingFocusRootProps,
} from './RovingFocus'

describe('RF-API-01 strict slot intersections', () => {
  it('exposes exactly one element child plus the documented kernel options', () => {
    expectTypeOf<RovingFocusRootProps['children']>().toEqualTypeOf<React.ReactElement>()
    expectTypeOf<RovingFocusItemProps['children']>().toEqualTypeOf<React.ReactElement>()
    expectTypeOf<RovingFocusRootProps['orientation']>().toEqualTypeOf<
      RovingFocusOrientation | undefined
    >()
    expectTypeOf<RovingFocusRootProps['loop']>().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<RovingFocusRootProps['typeahead']>().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<RovingFocusItemProps['id']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<RovingFocusItemProps['disabled']>().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<RovingFocusItemProps['textValue']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<RovingFocusRootProps['ref']>().toEqualTypeOf<
      React.Ref<HTMLElement> | undefined
    >()
    expectTypeOf<RovingFocusItemProps['ref']>().toEqualTypeOf<
      React.Ref<HTMLElement> | undefined
    >()
    // Slot surface: native div props, events, and shared StyleProps flow through.
    expectTypeOf<RovingFocusRootProps['onKeyDown']>().not.toBeNever()
    expectTypeOf<RovingFocusItemProps['css']>().not.toBeNever()
    expectTypeOf<RovingFocusItemProps['padding']>().not.toBeNever()
    expectTypeOf<RovingFocusRootProps>().not.toHaveProperty('as')
    expectTypeOf<RovingFocusItemProps>().not.toHaveProperty('as')
  })

  it('compiles representative StyleProps, one element, and documented options', () => {
    const rootRef = React.createRef<HTMLElement>()
    const itemRef = React.createRef<HTMLElement>()
    expectTypeOf(
      <RovingFocus.Root
        orientation="both"
        loop
        typeahead
        padding="4"
        css={{ display: 'flex' }}
        className="composite"
        style={{ gap: 8 }}
        id="toolbar"
        role="toolbar"
        aria-label="Formatting"
        data-testid="toolbar"
        tabIndex={-1}
        onKeyDown={() => {}}
        ref={rootRef}
      >
        <div />
      </RovingFocus.Root>
    ).not.toBeNever()
    expectTypeOf(
      <RovingFocus.Item
        id="item-bold"
        disabled={false}
        textValue="Bold"
        padding="2"
        className="item"
        onFocus={() => {}}
        onPointerDown={() => {}}
        ref={itemRef}
      >
        <button type="button" />
      </RovingFocus.Item>
    ).not.toBeNever()
  })

  it('rejects invalid Root children and orientation values', () => {
    // @ts-expect-error RF-API-01: children omitted
    const omitted = <RovingFocus.Root />
    // @ts-expect-error RF-API-01: null child
    const nulled = <RovingFocus.Root>{null}</RovingFocus.Root>
    // @ts-expect-error RF-API-01: false child
    const falsed = <RovingFocus.Root>{false}</RovingFocus.Root>
    // @ts-expect-error RF-API-01: text child
    const texted = <RovingFocus.Root>hello</RovingFocus.Root>
    // @ts-expect-error RF-API-01: number child
    const numbered = <RovingFocus.Root>{42}</RovingFocus.Root>
    const multi = (
      // @ts-expect-error RF-API-01: multiple elements
      <RovingFocus.Root>
        <div />
        <div />
      </RovingFocus.Root>
    )
    const diagonal = (
      // @ts-expect-error RF-API-01: invalid orientation
      <RovingFocus.Root orientation="diagonal">
        <div />
      </RovingFocus.Root>
    )
    expectTypeOf([omitted, nulled, falsed, texted, numbered, multi, diagonal]).not.toBeNever()
  })

  it('rejects invalid Item children and orientation-shaped values', () => {
    // @ts-expect-error RF-API-01: children omitted
    const omitted = <RovingFocus.Item />
    // @ts-expect-error RF-API-01: null child
    const nulled = <RovingFocus.Item>{null}</RovingFocus.Item>
    // @ts-expect-error RF-API-01: false child
    const falsed = <RovingFocus.Item>{false}</RovingFocus.Item>
    // @ts-expect-error RF-API-01: text child
    const texted = <RovingFocus.Item>hello</RovingFocus.Item>
    // @ts-expect-error RF-API-01: number child
    const numbered = <RovingFocus.Item>{42}</RovingFocus.Item>
    const multi = (
      // @ts-expect-error RF-API-01: multiple elements
      <RovingFocus.Item>
        <button type="button" />
        <button type="button" />
      </RovingFocus.Item>
    )
    const disabled = (
      // @ts-expect-error RF-API-01: invalid disabled value
      <RovingFocus.Item disabled="sometimes">
        <button type="button" />
      </RovingFocus.Item>
    )
    expectTypeOf([omitted, nulled, falsed, texted, numbered, multi, disabled]).not.toBeNever()
  })
})
