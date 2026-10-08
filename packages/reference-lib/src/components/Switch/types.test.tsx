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
    expectTypeOf<SwitchProps['onChange']>().toEqualTypeOf<
      ((checked: boolean, event: React.MouseEvent<HTMLButtonElement>) => void) | undefined
    >()
    expectTypeOf<SwitchProps['disabled']>().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<SwitchProps>().not.toHaveProperty('role')
    expectTypeOf<SwitchProps>().not.toHaveProperty('type')
    expectTypeOf<SwitchProps>().not.toHaveProperty('aria-checked')
    expectTypeOf<SwitchProps>().not.toHaveProperty('aria-pressed')
    expectTypeOf<SwitchProps>().not.toHaveProperty('data-state')
    expectTypeOf<SwitchProps>().not.toHaveProperty('data-disabled')

    // @ts-expect-error - checked="true" must fail (string not boolean)
    const _invalidChecked: SwitchProps = { checked: 'true' }
    expect(_invalidChecked).toBeDefined()

    // @ts-expect-error - role must not be public on SwitchProps
    const _invalidRole: SwitchProps = { checked: false, role: 'checkbox' }
    expect(_invalidRole).toBeDefined()

    // @ts-expect-error - type must not be public on SwitchProps
    const _invalidType: SwitchProps = { checked: false, type: 'submit' }
    expect(_invalidType).toBeDefined()

    // @ts-expect-error - aria-checked is managed by Root (FEATURES #2 Omit)
    const _invalidAriaChecked: SwitchProps = { checked: false, 'aria-checked': true }
    expect(_invalidAriaChecked).toBeDefined()

    // @ts-expect-error - aria-pressed is stripped by Root (FEATURES #2 Omit)
    const _invalidAriaPressed: SwitchProps = { checked: false, 'aria-pressed': true }
    expect(_invalidAriaPressed).toBeDefined()

    // NOTE: data-state / data-disabled are in the Omit list but cannot take
    // expect-error pins — TypeScript permits all data-* JSX attributes, so
    // only the not.toHaveProperty assertions above cover them. Runtime
    // managed-wins (SW-DOM-02) remains the enforcement for data-* conflicts.
  })
})
