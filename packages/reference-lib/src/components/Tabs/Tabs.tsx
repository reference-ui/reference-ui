import * as React from 'react'

export type TabsOrientation = 'horizontal' | 'vertical'
export type TabsActivation = 'automatic' | 'manual'

export interface TabsProps {
  children?: React.ReactNode
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  orientation?: TabsOrientation
  activation?: TabsActivation
  disabled?: boolean
}

interface TabsContextValue {
  value: string
  setValue: (value: string) => void
  orientation: TabsOrientation
  activation: TabsActivation
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
      disabled,
      baseId: baseIdRef.current!,
    }),
    [value, setValue, orientation, activation, disabled]
  )

  return (
    <TabsContext.Provider value={contextValue}>
      {children}
    </TabsContext.Provider>
  )
}

export function TabsList({
  children,
  className,
  style,
  onKeyDown,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const context = React.useContext(TabsContext)
  const orientation = context?.orientation ?? 'horizontal'

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

  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      data-orientation={orientation}
      data-reference-tabs-list=""
      onKeyDown={handleKeyDown}
      className={className}
      style={{
        display: 'flex',
        flexDirection: orientation === 'vertical' ? 'column' : 'row',
        gap: '4px',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export interface TabProps extends React.ComponentPropsWithoutRef<'button'> {
  value: string
}

export function Tab({
  value,
  children,
  disabled: disabledProp,
  onClick,
  onFocus,
  className,
  style,
  id: idProp,
  ...props
}: TabProps) {
  const context = React.useContext(TabsContext)
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

  return (
    <button
      type="button"
      role="tab"
      id={tabId}
      tabIndex={isSelected ? 0 : -1}
      aria-selected={isSelected}
      aria-controls={isSelected ? panelId : undefined}
      data-state={isSelected ? 'active' : 'inactive'}
      data-disabled={isDisabled ? '' : undefined}
      data-value={value}
      disabled={isDisabled}
      onClick={handleClick}
      className={className}
      style={{
        padding: '6px 12px',
        border: 'none',
        borderRadius: '4px',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        backgroundColor: isSelected ? '#0066cc' : '#eee',
        color: isSelected ? '#fff' : '#333',
        fontWeight: isSelected ? 600 : 400,
        opacity: isDisabled ? 0.5 : 1,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export interface TabPanelProps extends React.ComponentPropsWithoutRef<'div'> {
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
    <div
      role="tabpanel"
      id={panelId}
      aria-labelledby={tabId}
      hidden={!isSelected}
      data-state={isSelected ? 'active' : 'inactive'}
      data-value={value}
      className={className}
      style={{
        padding: '16px',
        ...style,
      }}
      {...props}
    >
      {isSelected && children}
    </div>
  )
}

export const TabsTrigger = Tab
export const TabsContent = TabPanel

Tabs.List = TabsList
Tabs.Tab = Tab
Tabs.Trigger = Tab
Tabs.Panel = TabPanel
Tabs.Content = TabPanel
