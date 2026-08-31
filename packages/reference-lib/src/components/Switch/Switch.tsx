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
          data-reference-switch=""
          data-state={checked ? 'checked' : 'unchecked'}
          data-disabled={disabled ? '' : undefined}
          onClick={handleClick}
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
