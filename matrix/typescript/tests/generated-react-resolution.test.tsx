import type { ComponentProps } from 'react'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { Div, type DivProps } from '@reference-ui/react'

type DivComponentProps = ComponentProps<typeof Div>
type DivColorProp = NonNullable<DivComponentProps['color']>
type DivBgProp = NonNullable<DivComponentProps['bg']>

function expectDivColor(_value: DivColorProp): void {}

function expectDivBg(_value: DivBgProp): void {}

describe('generated @reference-ui/react package', () => {
  it('resolves Div at runtime and in the TypeScript surface', () => {
    const props: DivProps = {
      children: 'Reference UI TypeScript matrix',
    }

    expect(Div).toBeTruthy()
    expect(props.children).toBe('Reference UI TypeScript matrix')
    expectTypeOf<DivProps>().toMatchTypeOf<DivComponentProps>()
  })

  it('keeps primitive color props token-aware in consumer space', () => {
    const tokenSafeProps: DivProps = {
      color: 'blue.400',
      bg: 'gray.300',
      p: '4',
      rounded: 'md',
    }

    const tokenSafeComponentProps: DivComponentProps = {
      color: 'blue.400',
      bg: 'gray.300',
      p: '4',
      rounded: 'md',
    }

    const validElement = <Div color="blue.400" bg="gray.300" p="4" rounded="md" />

    expectDivColor('blue.400')
    expectDivBg('gray.300')

    // @ts-expect-error primitive color props must not widen back to arbitrary strings
    const invalidDivProps: DivProps = { color: 'definitely-not-a-token' }

    // @ts-expect-error runtime component props must preserve the same token narrowing
    const invalidComponentProps: DivComponentProps = { bg: 'not-a-bg-token' }

    // @ts-expect-error JSX consumer usage must reject arbitrary color strings
    const invalidColorElement = <Div color="definitely-not-a-token" />

    // @ts-expect-error JSX consumer usage must reject arbitrary background tokens
    const invalidBgElement = <Div bg="not-a-bg-token" />

    // @ts-expect-error extracted color prop type must stay token-aware
    expectDivColor('definitely-not-a-token')

    // @ts-expect-error extracted bg prop type must stay token-aware
    expectDivBg('not-a-bg-token')

    expect(tokenSafeProps.color).toBe('blue.400')
    expect(tokenSafeComponentProps.bg).toBe('gray.300')
    expect(validElement).toBeTruthy()
    expectTypeOf<DivProps>().toMatchTypeOf<DivComponentProps>()
    void invalidDivProps
    void invalidComponentProps
    void invalidColorElement
    void invalidBgElement
  })
})