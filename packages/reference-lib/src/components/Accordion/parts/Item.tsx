/**
 * Accordion item: one collection member as a thin Collapsible alias. It
 * carries the authored id, the per-item disabled flag, and the
 * hidden-until-found default into the disclosure runtime; expansion itself
 * stays with the root's value policy, never with the item.
 */
import { Collapsible } from '../../Collapsible'
import type { AccordionItemProps } from '../types'

export function AccordionItem({ id, children, disabled = false, hiddenUntilFound = false }: AccordionItemProps) {
  return (
    <Collapsible id={id} disabled={disabled} hiddenUntilFound={hiddenUntilFound}>
      {children}
    </Collapsible>
  )
}
