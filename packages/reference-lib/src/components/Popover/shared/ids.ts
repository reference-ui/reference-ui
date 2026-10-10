/**
 * Popover content identity. nextPopoverContentId hands out the next
 * `popover-content-N` token; each Popover claims one at first render and
 * keeps it for life so the trigger's `aria-controls` and the content id
 * name the same node.
 */

let popoverIdCounter = 0

export function nextPopoverContentId(): string {
  popoverIdCounter += 1
  return `popover-content-${popoverIdCounter}`
}
