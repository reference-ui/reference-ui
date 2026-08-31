import * as React from 'react'
import { Div, type PrimitiveProps, type PrimitiveElement } from '@reference-ui/react'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../Collapsible'

export type AccordionExpansion = 'single' | 'multiple'
export type AccordionValue = string | string[] | null

export type AccordionProps = Omit<PrimitiveProps<'div'>, 'onChange' | 'value' | 'defaultValue'> & {
  expansion?: AccordionExpansion
  value?: AccordionValue
  defaultValue?: AccordionValue
  onChange?: (value: any) => void
  disabled?: boolean
  keyboard?: 'none' | 'arrows'
}

interface AccordionContextValue {
  expansion: AccordionExpansion
  isItemOpen: (id: string) => boolean
  toggleItem: (id: string) => void
  disabled: boolean
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null)

export type AccordionItemProps = PrimitiveProps<'div'> & {
  id: string
  children?: React.ReactNode
  disabled?: boolean
}

export function AccordionItem({ id, children, disabled = false, ...props }: AccordionItemProps) {
  const context = React.useContext(AccordionContext)

  if (!context) {
    return <>{children}</>
  }

  const isOpen = context.isItemOpen(id)
  const isDisabled = disabled || context.disabled

  return (
    <Collapsible
      open={isOpen}
      disabled={isDisabled}
      onOpenChange={() => {
        context.toggleItem(id)
      }}
    >
      <Div data-reference-accordion-item="" data-state={isOpen ? 'open' : 'closed'} {...props}>
        {children}
      </Div>
    </Collapsible>
  )
}

export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  function Accordion(
    {
      children,
      expansion = 'single',
      value: valueProp,
      defaultValue,
      onChange,
      disabled = false,
      keyboard = 'arrows',
      onKeyDown,
      ...props
    },
    ref
  ) {
    const isControlled = valueProp !== undefined
    const [internalValue, setInternalValue] = React.useState<AccordionValue>(() => {
      if (defaultValue !== undefined) return defaultValue
      return expansion === 'single' ? null : []
    })

    const currentValue = isControlled ? valueProp : internalValue

    const isItemOpen = React.useCallback(
      (id: string) => {
        if (expansion === 'single') {
          return currentValue === id
        }
        return Array.isArray(currentValue) && currentValue.includes(id)
      },
      [expansion, currentValue]
    )

    const toggleItem = React.useCallback(
      (id: string) => {
        let nextValue: AccordionValue
        if (expansion === 'single') {
          nextValue = currentValue === id ? null : id
        } else {
          const arr = Array.isArray(currentValue) ? [...currentValue] : []
          const index = arr.indexOf(id)
          if (index !== -1) {
            arr.splice(index, 1)
          } else {
            arr.push(id)
          }
          nextValue = arr
        }

        if (!isControlled) {
          setInternalValue(nextValue)
        }
        onChange?.(nextValue)
      },
      [expansion, currentValue, isControlled, onChange]
    )

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e)
      if (e.defaultPrevented || keyboard === 'none') return

      const triggers = Array.from(
        e.currentTarget.querySelectorAll<HTMLButtonElement>(
          '[data-reference-accordion-item] button[aria-expanded]'
        )
      ).filter(btn => !btn.disabled)

      if (triggers.length === 0) return

      const activeIndex = triggers.indexOf(document.activeElement as HTMLButtonElement)
      if (activeIndex === -1) return

      let targetIndex = -1
      if (e.key === 'ArrowDown') {
        targetIndex = (activeIndex + 1) % triggers.length
      } else if (e.key === 'ArrowUp') {
        targetIndex = (activeIndex - 1 + triggers.length) % triggers.length
      } else if (e.key === 'Home') {
        targetIndex = 0
      } else if (e.key === 'End') {
        targetIndex = triggers.length - 1
      }

      if (targetIndex !== -1) {
        e.preventDefault()
        triggers[targetIndex]?.focus()
      }
    }

    const contextValue = React.useMemo<AccordionContextValue>(
      () => ({
        expansion,
        isItemOpen,
        toggleItem,
        disabled,
      }),
      [expansion, isItemOpen, toggleItem, disabled]
    )

    return (
      <AccordionContext.Provider value={contextValue}>
        <Div
          ref={ref}
          data-reference-accordion=""
          onKeyDown={handleKeyDown}
          {...props}
        >
          {children}
        </Div>
      </AccordionContext.Provider>
    )
  }
) as React.ForwardRefExoticComponent<AccordionProps & React.RefAttributes<HTMLDivElement>> & {
  Item: typeof AccordionItem
  Trigger: typeof CollapsibleTrigger
  Content: typeof CollapsibleContent
}

Accordion.Item = AccordionItem
Accordion.Trigger = CollapsibleTrigger
Accordion.Content = CollapsibleContent
