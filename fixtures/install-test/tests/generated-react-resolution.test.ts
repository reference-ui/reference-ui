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
})