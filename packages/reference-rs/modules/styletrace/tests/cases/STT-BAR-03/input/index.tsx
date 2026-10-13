/**
 * Test file.
 * This file provides coverage for the respective domain.
 * It inputs test cases and emits test results.
 */

import { Button, Div, type StyleProps } from '@reference-ui/react'
import { Section } from './section'

export type PanelProps = StyleProps & {
  value: string
}

export function Panel({ value, ...styleProps }: PanelProps) {
  return <Div data-value={value} {...styleProps} />
}

export type ItemProps = StyleProps & {
  value: string
}

export function Item({ value, ...styleProps }: ItemProps) {
  return <Button data-value={value} {...styleProps} />
}

export function Plain({ label }: { label: string }) {
  return <div>{label}</div>
}

export function Tabs({ children }: { children?: unknown }) {
  return <>{children as never}</>
}

Tabs.Panel = Panel
Tabs.Item = Item
Tabs.Plain = Plain
Tabs.Section = Section
