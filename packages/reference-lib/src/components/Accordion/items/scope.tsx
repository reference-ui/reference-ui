/**
 * Nesting isolation: rewrites the root's children (through fragments) so each
 * item's own children render under a null Accordion scope. A standalone
 * Collapsible authored inside an item's Content therefore never reads the
 * outer collection's policy — it stays an independent disclosure (AC-NEST-02).
 */
import * as React from 'react'
import { AccordionContext } from '../context'
import { isItemElement } from './match'

export function scopeItemChildren(
  children: React.ReactNode,
  itemTypes: readonly unknown[]
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child
    if (child.type === React.Fragment) {
      return React.cloneElement(child, {
        children: scopeItemChildren((child.props as any).children, itemTypes),
      } as any)
    }
    if (isItemElement(child, itemTypes)) {
      // AC-NEST-02: Wrap child's children in <AccordionContext.Provider value={null}>
      // so any standalone Collapsible inside Content is NOT captured by this Accordion
      const childChildren = (child.props as any).children
      return React.cloneElement(
        child,
        undefined,
        <AccordionContext.Provider value={null}>
          {childChildren}
        </AccordionContext.Provider>
      )
    }
    return child
  })
}
