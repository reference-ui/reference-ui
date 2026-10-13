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

function TabsRoot({ children }: { children?: unknown }) {
  return <>{children as never}</>
}

TabsRoot.Item = Item
export const Tabs = TabsRoot
