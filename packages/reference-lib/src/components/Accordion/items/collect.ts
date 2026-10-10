/**
 * Authored identity collection: walks the root's children (through fragments)
 * and gathers each item's authored id in render order for multiple-mode
 * canonicalization. In dev it also enforces the collection contract —
 * missing, empty, and duplicate ids throw (AC-DOM-05), and a child carrying
 * its own `open`/`onChange` is reported as competing authority (AC-DOM-08).
 */
import * as React from 'react'
import { isItemElement } from './match'

export interface CollectItemIdsOptions {
  itemTypes: readonly unknown[]
  dev: boolean
}

export function collectItemIds(
  children: React.ReactNode,
  { itemTypes, dev }: CollectItemIdsOptions
): string[] {
  const ids: string[] = []
  const seenIds = new Set<string>()

  const traverse = (nodes: React.ReactNode) => {
    React.Children.forEach(nodes, (child) => {
      if (!React.isValidElement(child)) return

      if (child.type === React.Fragment) {
        traverse((child.props as any)?.children)
        return
      }

      if (isItemElement(child, itemTypes)) {
        const props = child.props as Record<string, any>
        if (dev) {
          // AC-DOM-05: Missing, empty, or duplicate item identities
          if (props.id === undefined) {
            const err = '[Reference UI Accordion] Item Collapsible is missing required "id" prop.'
            console.error(err)
            throw new Error(err)
          }
          if (props.id === '') {
            const err = '[Reference UI Accordion] Item Collapsible has an empty "id" prop.'
            console.error(err)
            throw new Error(err)
          }
          if (seenIds.has(props.id)) {
            const err = `[Reference UI Accordion] Duplicate item id "${props.id}". Each Accordion item must have a unique id.`
            console.error(err)
            throw new Error(err)
          }
          seenIds.add(props.id)

          // AC-DOM-08: Competing controlled props
          if (props.open !== undefined || props.onChange !== undefined) {
            console.error(
              '[Reference UI Accordion] Competing authority: Child Collapsible specifies "open" or "onChange" props while nested inside an Accordion. The root Accordion is the sole expansion authority.'
            )
          }
        }
        if (typeof props.id === 'string' && props.id !== '') {
          ids.push(props.id)
        }
      }
    })
  }

  traverse(children)
  return ids
}
