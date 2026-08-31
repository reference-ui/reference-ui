import * as React from 'react'
import { RovingFocus } from '../RovingFocus'

export type ListboxSelection = 'single' | 'multiple'
export type ListboxOrientation = 'horizontal' | 'vertical'
export type ListboxValue = string | string[] | null

export interface ListboxProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'onChange' | 'value' | 'defaultValue'> {
  selection?: ListboxSelection
  value?: ListboxValue
  defaultValue?: ListboxValue
  onChange?: (value: any) => void
  orientation?: ListboxOrientation
  disabled?: boolean
}

interface ListboxContextValue {
  selection: ListboxSelection
  orientation: ListboxOrientation
  value: ListboxValue
  disabled: boolean
  isOptionSelected: (val: string) => boolean
  selectOption: (val: string) => void
}

const ListboxContext = React.createContext<ListboxContextValue | null>(null)

export interface ListboxOptionProps extends React.ComponentPropsWithoutRef<'div'> {
  value: string
  disabled?: boolean
  textValue?: string
}

export function ListboxOption({
  value,
  disabled = false,
  textValue,
  children,
  onClick,
  onKeyDown,
  className,
  style,
  ...props
}: ListboxOptionProps) {
  const context = React.useContext(ListboxContext)
  const isSelected = context ? context.isOptionSelected(value) : false
  const isDisabled = disabled || (context?.disabled ?? false)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented && !isDisabled && context) {
      context.selectOption(value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (!e.defaultPrevented && !isDisabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      context?.selectOption(value)
    }
  }

  return (
    <RovingFocus.Item disabled={isDisabled} textValue={textValue}>
      <div
        role="option"
        tabIndex={isDisabled ? -1 : 0}
        aria-selected={isSelected}
        aria-disabled={isDisabled ? 'true' : undefined}
        data-state={isSelected ? 'selected' : 'unselected'}
        data-disabled={isDisabled ? '' : undefined}
        data-value={value}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '6px 10px',
          borderRadius: 4,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          backgroundColor: isSelected ? '#0066cc' : 'transparent',
          color: isSelected ? '#fff' : 'inherit',
          opacity: isDisabled ? 0.5 : 1,
          outline: 'none',
          userSelect: 'none',
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    </RovingFocus.Item>
  )
}

export const Listbox = React.forwardRef<HTMLDivElement, ListboxProps>(
  function Listbox(
    {
      children,
      selection = 'single',
      value: valueProp,
      defaultValue,
      onChange,
      orientation = 'vertical',
      disabled = false,
      className,
      style,
      ...props
    },
    ref
  ) {
    const isControlled = valueProp !== undefined
    const [internalValue, setInternalValue] = React.useState<ListboxValue>(() => {
      if (defaultValue !== undefined) return defaultValue
      return selection === 'single' ? null : []
    })

    const value = isControlled ? valueProp : internalValue

    const isOptionSelected = React.useCallback(
      (val: string) => {
        if (selection === 'single') {
          return value === val
        }
        return Array.isArray(value) && value.includes(val)
      },
      [selection, value]
    )

    const selectOption = React.useCallback(
      (val: string) => {
        let nextValue: ListboxValue
        if (selection === 'single') {
          nextValue = val
        } else {
          const arr = Array.isArray(value) ? [...value] : []
          const idx = arr.indexOf(val)
          if (idx !== -1) {
            arr.splice(idx, 1)
          } else {
            arr.push(val)
          }
          nextValue = arr
        }

        if (!isControlled) {
          setInternalValue(nextValue)
        }
        onChange?.(nextValue)
      },
      [selection, value, isControlled, onChange]
    )

    const contextValue = React.useMemo<ListboxContextValue>(
      () => ({
        selection,
        orientation,
        value,
        disabled,
        isOptionSelected,
        selectOption,
      }),
      [selection, orientation, value, disabled, isOptionSelected, selectOption]
    )

    return (
      <ListboxContext.Provider value={contextValue}>
        <RovingFocus.Root orientation={orientation} loop typeahead>
          <div
            ref={ref}
            role="listbox"
            aria-orientation={orientation}
            data-orientation={orientation}
            data-reference-listbox=""
            data-disabled={disabled ? '' : undefined}
            className={className}
            style={{
              display: 'flex',
              flexDirection: orientation === 'vertical' ? 'column' : 'row',
              gap: 2,
              padding: 4,
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              outline: 'none',
              ...style,
            }}
            {...props}
          >
            {children}
          </div>
        </RovingFocus.Root>
      </ListboxContext.Provider>
    )
  }
) as React.ForwardRefExoticComponent<ListboxProps & React.RefAttributes<HTMLDivElement>> & {
  Option: typeof ListboxOption
}

Listbox.Option = ListboxOption
