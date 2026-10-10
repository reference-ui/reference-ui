/**
 * Menu.RadioGroup: the controlled value scope for radio items.
 * Structural only — never a roving stop, never a typeahead match.
 * Takes the group value plus onChange and provides them; items read
 * checked state through the group and request through it.
 */
import * as React from 'react'
import { Div } from '@reference-ui/react'
import { MenuRadioGroupContext, type MenuRadioGroupValue } from '../context'
import type { MenuRadioGroupProps } from '../types'

export const MenuRadioGroup = React.forwardRef<HTMLDivElement, MenuRadioGroupProps>(
  function MenuRadioGroup(
    { children, value, onChange, className, style, ...props }: MenuRadioGroupProps,
    ref
  ) {
    // Structural only: never a roving stop, never a typeahead match.
    const groupValue = React.useMemo<MenuRadioGroupValue>(
      () => ({ value, onChange }),
      [value, onChange]
    )
    return (
      <MenuRadioGroupContext.Provider value={groupValue}>
        <Div role="group" className={className} style={style} {...props} ref={ref}>
          {children}
        </Div>
      </MenuRadioGroupContext.Provider>
    )
  }
)
