/**
 * Compound Tabs for ATM-SITE-87: traced PrimitiveProps wrappers plus member
 * assignments (Tabs.List/Tab/Panel) and an alias onto style-less Plain whose
 * member host must never mint.
 */
import { Button, Div, type PrimitiveProps } from '@reference-ui/react'

export type TabsListProps = PrimitiveProps<'div'> & {
  variant?: 'line' | 'pill'
}

export function TabsList({ children, ...props }: TabsListProps) {
  return <Div {...props}>{children}</Div>
}

export type TabProps = Omit<PrimitiveProps<'button'>, 'value'> & {
  value: string
}

export function Tab({ value, ...props }: TabProps) {
  void value
  return <Button {...props} />
}

export type TabPanelProps = Omit<PrimitiveProps<'div'>, 'value'> & {
  value: string
}

export function TabPanel({ value, ...props }: TabPanelProps) {
  void value
  return <Div {...props} />
}

export function Plain({ label }: { label: string }) {
  return <div>{label}</div>
}

export function Tabs({ children }: { children?: unknown }) {
  return <>{children as never}</>
}

Tabs.List = TabsList
Tabs.Tab = Tab
Tabs.Panel = TabPanel
Tabs.Plain = Plain
