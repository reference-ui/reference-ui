import * as React from 'react'
import { Div, Span, type PrimitiveProps } from '@reference-ui/react'
import { CheckIcon } from '@reference-ui/icons'
import { RovingFocus } from '../RovingFocus'
import { ComboboxContext } from '../Combobox/combobox-context'
import { formControlSize, formControlHeightPx } from '../../core/theme/primitives/shared'

export type ListboxSelection = 'single' | 'multiple'
export type ListboxOrientation = 'horizontal' | 'vertical'
export type ListboxValue = string | string[] | null

export type ListboxProps = Omit<PrimitiveProps<'div'>, 'onChange' | 'value' | 'defaultValue'> & {
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

export type ListboxOptionProps = PrimitiveProps<'div'> & {
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
  onPointerEnter,
  className,
  style,
  id: idProp,
  ...props
}: ListboxOptionProps) {
  const context = React.useContext(ListboxContext)
  const combobox = React.useContext(ComboboxContext)
  const isSelected = context
    ? context.isOptionSelected(value)
    : combobox
      ? combobox.value === value
      : false
  const isDisabled = disabled || (context?.disabled ?? false)

  const optionId = idProp ?? `ref-opt-${value}`
  const optionRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (combobox?.registerOption) {
      return combobox.registerOption({
        value,
        id: optionId,
        node: optionRef.current ?? (typeof document !== 'undefined' ? document.getElementById(optionId) : null),
        disabled: isDisabled,
        textValue: textValue ?? (typeof children === 'string' ? children : undefined),
      })
    }
  }, [combobox, value, optionId, isDisabled, textValue, children])

  const isActive = combobox
    ? combobox.activeValue === value || (combobox.activeValue === null && isSelected)
    : isSelected

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (combobox) e.preventDefault()
  }

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerEnter?.(e)
    if (!isDisabled && combobox) {
      combobox.setActiveValue(value)
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented && !isDisabled) {
      if (context) {
        context.selectOption(value)
      } else if (combobox) {
        combobox.handleSelect(value)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (!e.defaultPrevented && !isDisabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      if (context) {
        context.selectOption(value)
      } else if (combobox) {
        combobox.handleSelect(value)
      }
    }
  }

  return (
    <RovingFocus.Item id={optionId} disabled={isDisabled} textValue={textValue}>
      <Div
        ref={optionRef}
        id={optionId}
        role="option"
        tabIndex={isDisabled ? -1 : 0}
        aria-selected={isSelected}
        aria-disabled={isDisabled ? 'true' : undefined}
        data-state={isSelected ? 'selected' : 'unselected'}
        data-active={isActive ? '' : undefined}
        data-disabled={isDisabled ? '' : undefined}
        data-value={value}
        onMouseDown={handleMouseDown}
        onPointerEnter={handlePointerEnter}
        onPointerOver={handlePointerEnter}
        onMouseEnter={handlePointerEnter}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        display="flex"
        alignItems="center"
        justifyContent={combobox ? 'space-between' : undefined}
        height={formControlSize.height}
        minHeight={formControlSize.height}
        px="3r"
        py={formControlSize.paddingBlock}
        boxSizing="border-box"
        borderRadius="sm"
        fontSize="3.5r"
        lineHeight="5r"
        cursor={isDisabled ? 'not-allowed' : 'pointer'}
        bg={isActive ? 'ui.button.background' : 'transparent'}
        color={isActive ? 'ui.button.foreground' : 'design.text.base'}
        opacity={isDisabled ? 0.5 : 1}
        outline="none"
        userSelect="none"
        _hover={
          combobox
            ? undefined
            : (!isSelected && !isDisabled ? { bg: 'ui.table.row.mutedBackground', color: 'design.text.base' } : undefined)
        }
        _focus={
          combobox
            ? { outline: 'none' }
            : undefined
        }
        _focusVisible={
          combobox
            ? { outline: 'none' }
            : { outline: '2px solid', outlineColor: 'ui.focus.ring', outlineOffset: '-2px' }
        }
        css={{
          '& .ref-span': {
            color: 'inherit',
          },
          '& [data-slot="check"], & [data-slot="check"] *': {
            color: 'inherit',
            fill: 'currentColor',
          },
          '& [data-slot="description"]': {
            opacity: isActive ? 0.75 : 0.65,
            fontSize: '3r',
            lineHeight: '4r',
          },
        }}
        className={className}
        style={{
          minHeight: formControlHeightPx,
          height: formControlHeightPx,
          boxSizing: 'border-box',
          ...style,
        }}
        {...props}
      >
        {combobox ? (
          <>
            <Span
              flex="1"
              display="inline-flex"
              alignItems="center"
              minWidth="0"
              textAlign="start"
              color="inherit"
            >
              {children}
            </Span>
            {isSelected && (
              <Span
                data-slot="check"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                width="4r"
                height="4r"
                flexShrink={0}
                color="inherit"
              >
                <CheckIcon width="4r" height="4r" color="inherit" />
              </Span>
            )}
          </>
        ) : (
          children
        )}
      </Div>
    </RovingFocus.Item>
  )
}

const ListboxComponentBase = React.forwardRef<HTMLDivElement, ListboxProps>(
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
    const combobox = React.useContext(ComboboxContext)
    const isControlled = valueProp !== undefined
    const [internalValue, setInternalValue] = React.useState<ListboxValue>(() => {
      if (defaultValue !== undefined) return defaultValue
      return selection === 'single' ? null : []
    })

    const value = combobox
      ? combobox.value
      : isControlled
        ? valueProp
        : internalValue

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

        if (combobox) {
          combobox.handleSelect(val)
          return
        }

        if (!isControlled) {
          setInternalValue(nextValue)
        }
        onChange?.(nextValue)
      },
      [selection, value, isControlled, onChange, combobox]
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

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      props.onMouseLeave?.(e)
      if (combobox) {
        combobox.setActiveValue(combobox.value ?? null)
      }
    }

    return (
      <ListboxContext.Provider value={contextValue}>
        <RovingFocus.Root orientation={orientation} loop typeahead>
          <Div
            ref={ref}
            role="listbox"
            aria-orientation={orientation}
            data-orientation={orientation}
            data-reference-listbox=""
            data-disabled={disabled ? '' : undefined}
            display="flex"
            flexDirection={orientation === 'vertical' ? 'column' : 'row'}
            gap="0.5r"
            outline="none"
            onMouseLeave={handleMouseLeave}
            onPointerLeave={handleMouseLeave}
            p={combobox ? '0' : '1r'}
            bg={combobox ? 'transparent' : 'ui.dialog.background'}
            color={combobox ? 'inherit' : 'ui.dialog.foreground'}
            borderRadius={combobox ? undefined : 'md'}
            border={combobox ? undefined : '1px solid'}
            borderColor={combobox ? undefined : 'ui.dialog.border'}
            boxShadow={combobox ? undefined : '0 4px 16px rgba(0,0,0,0.12)'}
            className={className}
            style={style}
            {...props}
          >
            {children}
          </Div>
        </RovingFocus.Root>
      </ListboxContext.Provider>
    )
  }
)
export type ListboxSectionProps = PrimitiveProps<'div'> & {
  title?: React.ReactNode
}

export function ListboxSection({
  title,
  children,
  className,
  style,
  ...props
}: ListboxSectionProps) {
  const headingId = React.useId()
  return (
    <Div
      role="group"
      aria-labelledby={title ? headingId : undefined}
      data-reference-listbox-section=""
      display="flex"
      flexDirection="column"
      gap="0.5r"
      py="1r"
      className={className}
      style={style}
      {...props}
    >
      {title && (
        <Span
          id={headingId}
          data-reference-listbox-header=""
          display="block"
          px="3r"
          py="1r"
          fontSize="2.75r"
          fontWeight="600"
          textTransform="uppercase"
          letterSpacing="0.05em"
          color="design.text.light"
          userSelect="none"
        >
          {title}
        </Span>
      )}
      {children}
    </Div>
  )
}

export type ListboxHeaderProps = PrimitiveProps<'span'>

export function ListboxHeader({
  children,
  className,
  style,
  ...props
}: ListboxHeaderProps) {
  return (
    <Span
      data-reference-listbox-header=""
      display="block"
      px="3r"
      py="1r"
      fontSize="2.75r"
      fontWeight="600"
      textTransform="uppercase"
      letterSpacing="0.05em"
      color="design.text.light"
      userSelect="none"
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Span>
  )
}

export type ListboxEmptyProps = PrimitiveProps<'div'>

export function ListboxEmpty({
  children = 'No results found',
  className,
  style,
  ...props
}: ListboxEmptyProps) {
  return (
    <Div
      data-reference-listbox-empty=""
      role="status"
      aria-live="polite"
      px="3r"
      py="3r"
      fontSize="3.5r"
      color="design.text.light"
      textAlign="center"
      userSelect="none"
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Div>
  )
}

export type ListboxComponent = React.ForwardRefExoticComponent<ListboxProps & React.RefAttributes<HTMLDivElement>> & {
  Option: typeof ListboxOption
  Section: typeof ListboxSection
  Header: typeof ListboxHeader
  Empty: typeof ListboxEmpty
}

export const Listbox = ListboxComponentBase as ListboxComponent
Listbox.Option = ListboxOption
Listbox.Section = ListboxSection
Listbox.Header = ListboxHeader
Listbox.Empty = ListboxEmpty
