// Live Popover demos for the Popover component page.
// They take nothing and emit click and hover triggers. Colocated with the page that embeds
// them.
import { Div, Span } from '@reference-ui/react'
import { Popover } from '@reference-ui/lib'
import { floatingSurface } from './demo-surface'

/** A click-to-open popover anchored to its trigger, with a close button. */
export function PopoverDemo() {
  return (
    <Popover>
      <Popover.Trigger>Open filters</Popover.Trigger>
      <Popover.Content className={floatingSurface}>
        <Div display="flex" flexDirection="column" gap="2r">
          <Span fontWeight="600">Filters</Span>
          <Span>Interactive content anchored to the trigger.</Span>
          <Div>
            <Popover.Close>Close</Popover.Close>
          </Div>
        </Div>
      </Popover.Content>
    </Popover>
  )
}

/** A hover card: opens on pointer hover or keyboard focus. */
export function PopoverHoverDemo() {
  return (
    <Popover openOnHover>
      <Popover.Trigger>@reference-ui</Popover.Trigger>
      <Popover.Content className={floatingSurface}>
        <Div display="flex" flexDirection="column" gap="1r">
          <Span fontWeight="600">Reference UI</Span>
          <Span>Components and a design system compiled at build time.</Span>
        </Div>
      </Popover.Content>
    </Popover>
  )
}
