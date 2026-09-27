import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { Accordion } from './index'
import { Collapsible } from '../Collapsible'
import { dividerContent, dividerTrigger } from '../disclosureChrome'

export default {
  SingleExpansion: () => {
    const [value, setValue] = React.useState<string | null>('item-1')
    return (
    <Div maxW="100r" display="flex" flexDirection="column">
      <Accordion expansion="single" value={value} onChange={(v) => setValue(v as string | null)} display="flex" flexDirection="column">
        <Collapsible id="item-1">
          <Collapsible.Trigger {...dividerTrigger}>What is Reference UI?</Collapsible.Trigger>
          <Collapsible.Content {...dividerContent}>
            <Span fontSize="3.5r" color="design.text.light">
              A primitive-first component library with explicit composition and token-aware styling.
            </Span>
          </Collapsible.Content>
        </Collapsible>
        <Collapsible id="item-2">
          <Collapsible.Trigger {...dividerTrigger}>How do StyleProps work?</Collapsible.Trigger>
          <Collapsible.Content {...dividerContent}>
            <Span fontSize="3.5r" color="design.text.light">
              StyleProps are camelCased, token-aware CSS props on generated HTML primitives.
            </Span>
          </Collapsible.Content>
        </Collapsible>
        <Collapsible id="item-3">
          <Collapsible.Trigger {...dividerTrigger}>Why container queries?</Collapsible.Trigger>
          <Collapsible.Content {...dividerContent}>
            <Span fontSize="3.5r" color="design.text.light">
              Reference UI uses container queries instead of viewport breakpoints for responsive layout.
            </Span>
          </Collapsible.Content>
        </Collapsible>
      </Accordion>
    </Div>
    )
  },
  MultipleExpansion: () => {
    const [value, setValue] = React.useState<string[]>(['a', 'b'])
    return (
    <Div maxW="100r">
      <Accordion expansion="multiple" value={value} onChange={(v) => setValue(v as string[])} display="flex" flexDirection="column">
        <Collapsible id="a">
          <Collapsible.Trigger {...dividerTrigger}>Section A</Collapsible.Trigger>
          <Collapsible.Content {...dividerContent}>
            <Span fontSize="3.5r" color="design.text.light">
              Multiple sections can stay open at once.
            </Span>
          </Collapsible.Content>
        </Collapsible>
        <Collapsible id="b">
          <Collapsible.Trigger {...dividerTrigger}>Section B</Collapsible.Trigger>
          <Collapsible.Content {...dividerContent}>
            <Span fontSize="3.5r" color="design.text.light">
              Both A and B start expanded in this fixture.
            </Span>
          </Collapsible.Content>
        </Collapsible>
      </Accordion>
    </Div>
    )
  },
}
