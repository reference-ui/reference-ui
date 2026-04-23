import type { ComponentProps } from 'react'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { Div, type DivProps } from '@reference-ui/react'

describe('generated @reference-ui/react package', () => {
  it('resolves Div at runtime and in the TypeScript surface', () => {
    const props: DivProps = {
      children: 'Reference UI install test',
    }

    expect(Div).toBeTruthy()
    expect(props.children).toBe('Reference UI install test')
    expectTypeOf<DivProps>().toMatchTypeOf<ComponentProps<typeof Div>>()
  })

  it('keeps primitive color props token-aware in consumer space', () => {
    const tokenSafeProps: DivProps = {
      color: 'blue.400',
      bg: 'gray.300',
      p: '4',
      rounded: 'md',
    }

    const tokenSafeComponentProps: ComponentProps<typeof Div> = {
      color: 'blue.400',
      bg: 'gray.300',
      p: '4',
      rounded: 'md',
    }

    // @ts-expect-error primitive color props must not widen back to arbitrary strings
    const invalidDivProps: DivProps = { color: 'definitely-not-a-token' }

    // @ts-expect-error runtime component props must preserve the same token narrowing
    const invalidComponentProps: ComponentProps<typeof Div> = { bg: 'not-a-bg-token' }

    expect(tokenSafeProps.color).toBe('blue.400')
    expect(tokenSafeComponentProps.bg).toBe('gray.300')
    expectTypeOf<DivProps>().toMatchTypeOf<ComponentProps<typeof Div>>()
    expectTypeOf<ComponentProps<typeof Div>>().not.toEqualTypeOf<{ color?: string }>()
    void invalidDivProps
    void invalidComponentProps
  })
})