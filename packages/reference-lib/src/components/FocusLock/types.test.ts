import type * as React from 'react'
import { describe, expectTypeOf, it } from 'vitest'
import type { FocusLockProps, FocusTarget } from './FocusLock'

describe('FL-TYPE-01', () => {
  it('exposes the documented child shape and focus option unions', () => {
    expectTypeOf<FocusLockProps['children']>().toEqualTypeOf<
      React.ReactElement | null | false | undefined
    >()
    expectTypeOf<FocusLockProps['initialFocus']>().toEqualTypeOf<FocusTarget | boolean | undefined>()
    expectTypeOf<FocusLockProps['restoreFocus']>().toEqualTypeOf<FocusTarget | boolean | undefined>()
    expectTypeOf<FocusLockProps['disabled']>().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<FocusLockProps>().not.toHaveProperty('as')
    expectTypeOf<FocusTarget>().toMatchTypeOf<
      HTMLElement | React.RefObject<HTMLElement | null> | (() => HTMLElement | null)
    >()
  })
})
