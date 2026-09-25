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
  rovingValue: string
  setRovingValue: (value: string) => void
  claimTabValue: (tabValue: string) => () => void
  claimPanelValue: (panelValue: string) => () => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

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

  // Stable SSR-safe identity (TB-DOM-07, TB-ENV-01): useId keeps
  // server/client markup identical, unlike a module counter.
  const reactId = React.useId()
  const baseId = `tabs-${reactId.replace(/:/g, '')}`

  // Roving tab stop (TB-DOM-03, TB-MANUAL-01): follows focus so manual
  // arrows can leave the selected tab; selection changes re-sync it.
  const [rovingValue, setRovingValueState] = React.useState(value)
  const setRovingValue = React.useCallback((next: string) => {
    setRovingValueState(next)
  }, [])
  React.useEffect(() => {
    setRovingValueState(value)
  }, [value])

  // Duplicate tracking (TB-DOM-10): value identity is claimed in an
  // effect with cleanup, so StrictMode double-render/double-effects and
  // dynamic add/remove never false-positive. Render-phase claiming
  // breaks under React 17/18 double-render (hook state resets between
  // the two invocations); commit-phase claiming is version-robust.
  const tabValueCounts = React.useRef<Map<string, number>>(new Map())
  const panelValueCounts = React.useRef<Map<string, number>>(new Map())
  const claimTabValue = React.useCallback((tabValue: string) => {
    const counts = tabValueCounts.current
    const next = (counts.get(tabValue) ?? 0) + 1
    counts.set(tabValue, next)
    if (next > 1) {
      throw new Error(
        `Reference UI: Tabs contains duplicate Tab value "${tabValue}". Every Tab must have a unique value.`
      )
    }
    return () => {
      const left = (counts.get(tabValue) ?? 1) - 1
      if (left <= 0) counts.delete(tabValue)
      else counts.set(tabValue, left)
    }
  }, [])
  const claimPanelValue = React.useCallback((panelValue: string) => {
    const counts = panelValueCounts.current
    const next = (counts.get(panelValue) ?? 0) + 1
    counts.set(panelValue, next)
    if (next > 1) {
      throw new Error(
        `Reference UI: Tabs contains duplicate Panel value "${panelValue}". Every Panel must have a unique value.`
      )
    }
    return () => {
      const left = (counts.get(panelValue) ?? 1) - 1
      if (left <= 0) counts.delete(panelValue)
      else counts.set(panelValue, left)
    }
  }, [])

  const setValue = React.useCallback(
    (nextValue: string) => {
      // Redundant requests are suppressed (TB-SELECT-04, TB-MANUAL-04):
      // activating the selected tab is a no-op, not a transition.
      if (nextValue === value) return
      if (!isControlled) {
        setInternalValue(nextValue)
      }
      onChange?.(nextValue)
    },
    [isControlled, onChange, value]
  )

  const contextValue = React.useMemo<TabsContextValue>(
    () => ({
      value,
      setValue,
      orientation,
      activation,
      variant,
      disabled,
      baseId,
      rovingValue,
      setRovingValue,
      claimTabValue,
      claimPanelValue,
    }),
    [
      value,
      setValue,
      orientation,
      activation,
      variant,
      disabled,
      baseId,
      rovingValue,
      setRovingValue,
      claimTabValue,
      claimPanelValue,
    ]
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

    // Scope to this list only (TB-NEST-01): nested instances' tabs live
    // inside this subtree but belong to their own tablist.
    const tabs = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    ).filter(
      tab =>
        !tab.disabled &&
        tab.closest('[role="tablist"]') === e.currentTarget
    )

    if (tabs.length === 0) return

    const activeIndex = tabs.indexOf(document.activeElement as HTMLButtonElement)
    if (activeIndex === -1) return

    // Read at event time (TB-AUTO-02, TB-AUTO-06): runtime dir flips apply
    // to the next keypress with no cached direction to go stale.
    const dirAncestor = e.currentTarget.closest('[dir]')
    const isRTL = dirAncestor?.getAttribute('dir') === 'rtl'

    let targetIndex = -1

    if (orientation === 'horizontal') {
      if (e.key === 'ArrowRight') {
        targetIndex = isRTL
          ? (activeIndex - 1 + tabs.length) % tabs.length
          : (activeIndex + 1) % tabs.length
      } else if (e.key === 'ArrowLeft') {
        targetIndex = isRTL
          ? (activeIndex + 1) % tabs.length
          : (activeIndex - 1 + tabs.length) % tabs.length
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
      bg={isLine ? 'transparent' : 'ui.tab.track.background'}
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

  // Duplicate identity is a hard error (TB-DOM-10): value is the public
  // Tab-to-Panel mapping, so a collision would fork ARIA linkage.
  // Claimed in an effect (commit phase), never during render.
  const claimTabValue = context?.claimTabValue
  React.useEffect(() => {
    if (!claimTabValue) return
    return claimTabValue(value)
  }, [claimTabValue, value])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (!e.defaultPrevented && !isDisabled && context) {
      context.setValue(value)
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    onFocus?.(e)
    // The roving stop tracks focus (TB-MANUAL-01); disabled tabs stay
    // unreachable (TB-DOM-08, TB-DOM-11).
    if (!isDisabled && context) {
      context.setRovingValue(value)
    }
  }

  const isLine = variant === 'line'
  const isRovingStop =
    !!context && !isDisabled && context.rovingValue === value

  return (
    <Button
      type="button"
      role="tab"
      id={tabId}
      tabIndex={isRovingStop ? 0 : -1}
      aria-selected={isSelected}
      aria-controls={isSelected ? panelId : undefined}
      data-state={isSelected ? 'active' : 'inactive'}
      data-variant={variant}
      data-disabled={isDisabled ? '' : undefined}
      data-value={value}
      disabled={isDisabled}
      onClick={handleClick}
      onFocus={handleFocus}
      h={isLine ? 'auto' : undefined}
      px={isLine ? (orientation === 'vertical' ? '3r' : '2r') : '3r'}
      pt={isLine ? (orientation === 'horizontal' ? '2.5r' : '2r') : '1.5r'}
      pb={isLine ? (orientation === 'horizontal' ? '3.5r' : '2r') : '1.5r'}
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
          ? 'gray.200'
          : 'transparent'
      }
      color={
        isSelected
          ? isLine
            ? 'design.text.base'
            : 'ui.button.foreground'
          : 'design.text.light'
      }
      fontWeight="500"
      textShadow={isLine && isSelected ? '0 0 0.4px currentColor' : undefined}
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

  const claimPanelValue = context?.claimPanelValue
  React.useEffect(() => {
    if (!claimPanelValue) return
    return claimPanelValue(value)
  }, [claimPanelValue, value])

  return (
    <Div
      role="tabpanel"
      id={panelId}
      aria-labelledby={tabId}
      hidden={!isSelected}
      data-state={isSelected ? 'active' : 'inactive'}
      data-value={value}
      py="5r"
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
