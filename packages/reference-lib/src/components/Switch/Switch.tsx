import * as React from 'react'
import { Button, Span, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'

export type SwitchProps = Omit<PrimitiveProps<'button'>, 'onChange' | 'role' | 'type'> & {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
}

export type SwitchThumbProps = PrimitiveProps<'span'>

interface SwitchContextValue {
  checked: boolean
  disabled: boolean
}

const SwitchContext = React.createContext<SwitchContextValue | null>(null)

export function SwitchThumb({ className, style, ...props }: SwitchThumbProps) {
  const context = React.useContext(SwitchContext)
  const checked = context?.checked ?? false
  const disabled = context?.disabled ?? false

  return (
    <Span
      data-reference-switch-thumb=""
      data-state={checked ? 'checked' : 'unchecked'}
      data-disabled={disabled ? '' : undefined}
      display="inline-block"
      width="5r"
      height="5r"
      borderRadius="full"
      bg="ui.checkbox.tick.stroke"
      boxShadow="0 1px 3px rgba(0,0,0,0.2)"
      transition="transform 200ms ease"
      transform={checked ? 'translateX(5r)' : 'translateX(0)'}
      pointerEvents="none"
      className={className}
      style={style}
      {...props}
    />
  )
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  function Switch(
    {
      children,
      checked: checkedProp,
      defaultChecked = false,
      onChange,
      disabled = false,
      onClick,
      style,
      className,
      ...props
    },
    ref
  ) {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked)
    const isControlled = checkedProp !== undefined
    const checked = isControlled ? checkedProp : internalChecked

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      if (!e.defaultPrevented && !disabled) {
        const nextChecked = !checked
        if (!isControlled) {
          setInternalChecked(nextChecked)
        }
        onChange?.(nextChecked)
      }
    }

    const contextValue = React.useMemo(
      () => ({ checked, disabled }),
      [checked, disabled]
    )

    const hasAuthoredThumb = React.Children.toArray(children).some(
      child => React.isValidElement(child) && (child.type === SwitchThumb || (child.type as any)?.displayName === 'SwitchThumb')
    )

    return (
      <SwitchContext.Provider value={contextValue}>
        <Button
          type="button"
          role="switch"
          ref={ref}
          disabled={disabled}
          aria-checked={checked}
          data-state={checked ? 'checked' : 'unchecked'}
          data-disabled={disabled ? '' : undefined}
          onClick={handleClick}
          display="inline-flex"
          alignItems="center"
          width="11r"
          height="6r"
          p="0.5r"
          borderRadius="full"
          border="none"
          cursor={disabled ? 'not-allowed' : 'pointer'}
          bg={checked ? 'ui.checkbox.checked.fill' : 'colors.gray.300'}
          opacity={disabled ? 0.6 : 1}
          transition="background-color 200ms ease"
          _focusVisible={{ outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '2px' }}
          className={className}
          style={style}
          {...props}
        >
          {children}
          {!hasAuthoredThumb && <SwitchThumb />}
        </Button>
      </SwitchContext.Provider>
    )
  }
) as React.ForwardRefExoticComponent<SwitchProps & React.RefAttributes<HTMLButtonElement>> & {
  Thumb: typeof SwitchThumb
}

SwitchThumb.displayName = 'SwitchThumb'
Switch.Thumb = SwitchThumb
