import * as React from 'react'
import { Button, Div, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'

export type TabsOrientation = 'horizontal' | 'vertical'
export type TabsActivation = 'automatic' | 'manual'
export type TabsVariant = 'line' | 'pill'

export interface TabsProps {
  children?: React.ReactNode
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  orientation?: TabsOrientation
  activation?: TabsActivation
  variant?: TabsVariant
  disabled?: boolean
}

interface TabsContextValue {
  value: string
  setValue: (value: string) => void
  orientation: TabsOrientation
  activation: TabsActivation
  variant: TabsVariant
  disabled: boolean
  baseId: string
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

let tabsIdCounter = 0

export function Tabs({
  children,
  value: valueProp,
  defaultValue = '',
  onChange,
  orientation = 'horizontal',
  activation = 'automatic',
  variant = 'line',
  disabled = false,
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const isControlled = valueProp !== undefined
  const value = isControlled ? valueProp : internalValue

  const baseIdRef = React.useRef<string | null>(null)
  if (!baseIdRef.current) {
    baseIdRef.current = `tabs-${++tabsIdCounter}`
  }

  const setValue = React.useCallback(
    (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue)
      }
      onChange?.(nextValue)
    },
    [isControlled, onChange]
  )

  const contextValue = React.useMemo<TabsContextValue>(
    () => ({
      value,
      setValue,
      orientation,
      activation,
      variant,
      disabled,
      baseId: baseIdRef.current!,
    }),
    [value, setValue, orientation, activation, variant, disabled]
  )

  return (
    <TabsContext.Provider value={contextValue}>
      {children}
    </TabsContext.Provider>
  )
}

export type TabsListProps = PrimitiveProps<'div'> & {
  variant?: TabsVariant
}

export function TabsList({
  children,
  variant: variantProp,
  className,
  style,
  onKeyDown,
  ...props
}: TabsListProps) {
  const context = React.useContext(TabsContext)
  const orientation = context?.orientation ?? 'horizontal'
  const variant = variantProp ?? context?.variant ?? 'line'

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e)
    if (e.defaultPrevented) return

    const tabs = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    ).filter(tab => !tab.disabled)

    if (tabs.length === 0) return

    const activeIndex = tabs.indexOf(document.activeElement as HTMLButtonElement)
    if (activeIndex === -1) return

    let targetIndex = -1

    if (orientation === 'horizontal') {
      if (e.key === 'ArrowRight') {
        targetIndex = (activeIndex + 1) % tabs.length
      } else if (e.key === 'ArrowLeft') {
        targetIndex = (activeIndex - 1 + tabs.length) % tabs.length
      }
    } else {
      if (e.key === 'ArrowDown') {
        targetIndex = (activeIndex + 1) % tabs.length
      } else if (e.key === 'ArrowUp') {
        targetIndex = (activeIndex - 1 + tabs.length) % tabs.length
      }
    }

    if (e.key === 'Home') {
      targetIndex = 0
    } else if (e.key === 'End') {
      targetIndex = tabs.length - 1
    }

    if (targetIndex !== -1) {
      e.preventDefault()
      const targetTab = tabs[targetIndex]
      targetTab?.focus()
      if (context?.activation === 'automatic') {
        const val = targetTab?.getAttribute('data-value')
        if (val) {
          context.setValue(val)
        }
      }
    }
  }

  const isLine = variant === 'line'

  return (
    <Div
      role="tablist"
      aria-orientation={orientation}
      data-orientation={orientation}
      data-variant={variant}
      data-reference-tabs-list=""
      onKeyDown={handleKeyDown}
      display={isLine ? 'flex' : 'inline-flex'}
      flexDirection={orientation === 'vertical' ? 'column' : 'row'}
      gap={isLine ? (orientation === 'horizontal' ? '4r' : '1r') : '1r'}
      borderBottomWidth={isLine && orientation === 'horizontal' ? '1px' : undefined}
      borderBottomStyle={isLine && orientation === 'horizontal' ? 'solid' : undefined}
      borderBottomColor={isLine && orientation === 'horizontal' ? 'ui.table.border' : undefined}
      borderRightWidth={isLine && orientation === 'vertical' ? '1px' : undefined}
      borderRightStyle={isLine && orientation === 'vertical' ? 'solid' : undefined}
      borderRightColor={isLine && orientation === 'vertical' ? 'ui.table.border' : undefined}
      bg={isLine ? 'transparent' : 'ui.table.row.mutedBackground'}
      p={isLine ? '0' : '1r'}
      borderRadius={isLine ? undefined : 'md'}
      position="relative"
      className={className}
      style={{
        borderBottomColor: isLine && orientation === 'horizontal' ? 'var(--colors-ui-table-border)' : undefined,
        borderRightColor: isLine && orientation === 'vertical' ? 'var(--colors-ui-table-border)' : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </Div>
  )
}

export type TabProps = Omit<PrimitiveProps<'button'>, 'value'> & {
  value: string
  variant?: TabsVariant
}

export function Tab({
  value,
  children,
  variant: variantProp,
  disabled: disabledProp,
  onClick,
  onFocus,
  className,
  style,
  id: idProp,
  ...props
}: TabProps) {
  const context = React.useContext(TabsContext)
  const orientation = context?.orientation ?? 'horizontal'
  const variant = variantProp ?? context?.variant ?? 'line'
  const isSelected = context ? context.value === value : false
  const isDisabled = disabledProp ?? context?.disabled ?? false
  const tabId = idProp ?? (context ? `${context.baseId}-tab-${value}` : undefined)
  const panelId = context ? `${context.baseId}-panel-${value}` : undefined

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented && !isDisabled && context) {
      context.setValue(value)
    }
  }

  const isLine = variant === 'line'

  return (
    <Button
      type="button"
      role="tab"
      id={tabId}
      tabIndex={isSelected ? 0 : -1}
      aria-selected={isSelected}
      aria-controls={isSelected ? panelId : undefined}
      data-state={isSelected ? 'active' : 'inactive'}
      data-variant={variant}
      data-disabled={isDisabled ? '' : undefined}
      data-value={value}
      disabled={isDisabled}
      onClick={handleClick}
      px={isLine ? '2r' : '3r'}
      py={isLine ? '2.5r' : '1.5r'}
      border="none"
      borderBottom={
        isLine && orientation === 'horizontal'
          ? isSelected
            ? '3px solid'
            : '3px solid transparent'
          : undefined
      }
      borderRight={
        isLine && orientation === 'vertical'
          ? isSelected
            ? '3px solid'
            : '3px solid transparent'
          : undefined
      }
      borderColor={isLine && isSelected ? 'ui.focus.ring' : 'transparent'}
      marginBottom={isLine && orientation === 'horizontal' ? '-1px' : undefined}
      marginRight={isLine && orientation === 'vertical' ? '-1px' : undefined}
      borderRadius={isLine ? '0' : 'sm'}
      cursor={isDisabled ? 'not-allowed' : 'pointer'}
      bg={
        isLine
          ? 'transparent'
          : isSelected
          ? 'ui.dialog.background'
          : 'transparent'
      }
      color={isSelected ? 'design.text.base' : 'design.text.light'}
      fontWeight="500"
      textShadow={isSelected ? '0 0 0.4px currentColor' : undefined}
      fontSize="3.5r"
      boxShadow={!isLine && isSelected ? '0 1px 3px rgba(0,0,0,0.12)' : 'none'}
      opacity={isDisabled ? 0.5 : 1}
      transition="color 150ms ease, border-color 150ms ease, background-color 150ms ease"
      _hover={
        !isSelected && !isDisabled
          ? isLine
            ? { color: 'design.text.base', borderColor: 'ui.field.border' }
            : { color: 'design.text.base', bg: 'rgba(255,255,255,0.04)' }
          : undefined
      }
      _focusVisible={{
        outline: '2px solid',
        outlineColor: 'ui.focus.ring',
        outlineOffset: isLine ? '-2px' : '2px',
      }}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </Button>
  )
}

export type TabPanelProps = Omit<PrimitiveProps<'div'>, 'value'> & {
  value: string
}

export function TabPanel({
  value,
  children,
  id: idProp,
  className,
  style,
  ...props
}: TabPanelProps) {
  const context = React.useContext(TabsContext)
  const isSelected = context ? context.value === value : false
  const tabId = context ? `${context.baseId}-tab-${value}` : undefined
  const panelId = idProp ?? (context ? `${context.baseId}-panel-${value}` : undefined)

  return (
    <Div
      role="tabpanel"
      id={panelId}
      aria-labelledby={tabId}
      hidden={!isSelected}
      data-state={isSelected ? 'active' : 'inactive'}
      data-value={value}
      py="3r"
      px="0"
      color="design.text.base"
      className={className}
      style={style}
      {...props}
    >
      {isSelected && children}
    </Div>
  )
}

export const TabsTrigger = Tab
export const TabsContent = TabPanel

Tabs.List = TabsList
Tabs.Tab = Tab
Tabs.Trigger = Tab
Tabs.Panel = TabPanel
Tabs.Content = TabPanel
