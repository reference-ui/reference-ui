import * as React from 'react'

export interface SwitchProps
  extends Omit<React.ComponentPropsWithoutRef<'button'>, 'onChange' | 'role' | 'type'> {
  checked?: boolean
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
}

export interface SwitchThumbProps extends React.ComponentPropsWithoutRef<'span'> {}

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
    <span
      data-reference-switch-thumb=""
      data-state={checked ? 'checked' : 'unchecked'}
      data-disabled={disabled ? '' : undefined}
      className={className}
      style={{
        display: 'inline-block',
        width: 20,
        height: 20,
        borderRadius: '50%',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        transition: 'transform 0.2s',
        transform: checked ? 'translateX(20px)' : 'translateX(0px)',
        pointerEvents: 'none',
        ...style,
      }}
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
        <button
          type="button"
          role="switch"
          ref={ref}
          disabled={disabled}
          aria-checked={checked}
          data-state={checked ? 'checked' : 'unchecked'}
          data-disabled={disabled ? '' : undefined}
          onClick={handleClick}
          className={className}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            width: 44,
            height: 24,
            padding: 2,
            borderRadius: 12,
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            backgroundColor: checked ? '#0066cc' : '#ccc',
            opacity: disabled ? 0.6 : 1,
            transition: 'background-color 0.2s',
            ...style,
          }}
          {...props}
        >
          {children}
          {!hasAuthoredThumb && <SwitchThumb />}
        </button>
      </SwitchContext.Provider>
    )
  }
) as React.ForwardRefExoticComponent<SwitchProps & React.RefAttributes<HTMLButtonElement>> & {
  Thumb: typeof SwitchThumb
}

SwitchThumb.displayName = 'SwitchThumb'
Switch.Thumb = SwitchThumb
