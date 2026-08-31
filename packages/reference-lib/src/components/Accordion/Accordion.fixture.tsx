import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { Accordion } from './index'
import { Collapsible } from '../Collapsible'

const triggerProps = {
  width: '100%' as const,
  textAlign: 'left' as const,
  justifyContent: 'flex-start' as const,
  bg: 'ui.field.background',
  color: 'ui.field.foreground',
  borderColor: 'ui.field.border',
}

export default {
  SingleExpansion: () => (
    <Div maxW="100r" display="flex" flexDirection="column" gap="2r">
      <Accordion expansion="single" defaultValue="item-1" display="flex" flexDirection="column" gap="1r">
        <Collapsible id="item-1">
          <Collapsible.Trigger {...triggerProps}>What is Reference UI?</Collapsible.Trigger>
          <Collapsible.Content p="3r">
            <Span fontSize="3.5r" color="design.text.light">
              A primitive-first component library with explicit composition and token-aware styling.
            </Span>
          </Collapsible.Content>
        </Collapsible>
        <Collapsible id="item-2">
          <Collapsible.Trigger {...triggerProps}>How do StyleProps work?</Collapsible.Trigger>
          <Collapsible.Content p="3r">
            <Span fontSize="3.5r" color="design.text.light">
              StyleProps are camelCased, token-aware CSS props on generated HTML primitives.
            </Span>
          </Collapsible.Content>
        </Collapsible>
        <Collapsible id="item-3">
          <Collapsible.Trigger {...triggerProps}>Why container queries?</Collapsible.Trigger>
          <Collapsible.Content p="3r">
            <Span fontSize="3.5r" color="design.text.light">
              Reference UI uses container queries instead of viewport breakpoints for responsive layout.
            </Span>
          </Collapsible.Content>
        </Collapsible>
      </Accordion>
    </Div>
  ),
  MultipleExpansion: () => (
    <Div maxW="100r">
      <Accordion expansion="multiple" defaultValue={['a', 'b']} display="flex" flexDirection="column" gap="1r">
        <Collapsible id="a">
          <Collapsible.Trigger {...triggerProps}>Section A</Collapsible.Trigger>
          <Collapsible.Content p="3r">
            <Span fontSize="3.5r" color="design.text.light">
              Multiple sections can stay open at once.
            </Span>
          </Collapsible.Content>
        </Collapsible>
        <Collapsible id="b">
          <Collapsible.Trigger {...triggerProps}>Section B</Collapsible.Trigger>
          <Collapsible.Content p="3r">
            <Span fontSize="3.5r" color="design.text.light">
              Both A and B start expanded in this fixture.
            </Span>
          </Collapsible.Content>
        </Collapsible>
      </Accordion>
    </Div>
  ),
}
