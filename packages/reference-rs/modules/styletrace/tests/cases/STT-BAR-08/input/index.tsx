/**
 * Test file.
 * This file provides coverage for the respective domain.
 * It inputs test cases and emits test results.
 */

import { Div, type StyleProps } from '@reference-ui/react'

export type ItemProps = StyleProps & {
  value: string
}

export function Item({ value, ...styleProps }: ItemProps) {
  return <Div data-value={value} {...styleProps} />
}

export type PanelProps = StyleProps & {
  value: string
}

export function Panel({ value, ...styleProps }: PanelProps) {
  return <Div data-value={value} {...styleProps} />
}

export function Plain({ label }: { label: string }) {
  return <div>{label}</div>
}

function TabsRoot({ children }: { children?: unknown }) {
  return <>{children as never}</>
}

export const Tabs = Object.assign(TabsRoot, { Item, Panel, Plain })
