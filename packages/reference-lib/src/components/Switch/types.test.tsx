import * as React from 'react'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { Switch, type SwitchProps, type SwitchThumbProps } from './Switch'

describe('Switch type contract', () => {
  it('SW-TYPE-01: Switch should preserve behavior-prop types when StyleProps are also supplied', () => {
    // Landing re-target: defaultChecked is intentionally allowed (uncontrolled
    // mode preserved per recon exhibit 1), unlike the TESTS.md freeze catalog.
    const validProps: SwitchProps = {
      checked: false,
      defaultChecked: false,
      onChange: (checked: boolean) => void checked,
      disabled: false,
      width: '6r',
      css: { opacity: 0.5 },
      r: { 320: { width: '7r' } },
    }
    expect(validProps.checked).toBe(false)
    expect(typeof validProps.onChange).toBe('function')

    const validThumbProps: SwitchThumbProps = {
      width: '2r',
      bg: 'bg',
    }
    expect(validThumbProps.width).toBe('2r')
    expect(validThumbProps.bg).toBe('bg')

    const element = (
      <Switch {...validProps}>
        <Switch.Thumb {...validThumbProps} />
      </Switch>
    )
    expect(React.isValidElement(element)).toBe(true)

    expectTypeOf<SwitchProps['checked']>().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<SwitchProps['defaultChecked']>().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<SwitchProps['onChange']>().toEqualTypeOf<((checked: boolean) => void) | undefined>()
    expectTypeOf<SwitchProps['disabled']>().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<SwitchProps>().not.toHaveProperty('role')
    expectTypeOf<SwitchProps>().not.toHaveProperty('type')

    // @ts-expect-error - checked="true" must fail (string not boolean)
    const _invalidChecked: SwitchProps = { checked: 'true' }
    expect(_invalidChecked).toBeDefined()

    // @ts-expect-error - role must not be public on SwitchProps
    const _invalidRole: SwitchProps = { checked: false, role: 'checkbox' }
    expect(_invalidRole).toBeDefined()

    // @ts-expect-error - type must not be public on SwitchProps
    const _invalidType: SwitchProps = { checked: false, type: 'submit' }
    expect(_invalidType).toBeDefined()

    // NOTE: aria-checked / aria-pressed stay in the public types (no Omit churn);
    // at runtime Root owns them (aria-pressed stripped, aria-checked managed-wins).
  })
})
