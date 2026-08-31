import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { Accordion } from './index'

export default {
  SingleExpansion: () => (
    <Div maxW="100r" display="flex" flexDirection="column" gap="2r">
      <Accordion expansion="single" defaultValue="item-1">
        <Accordion.Item id="item-1">
          <Accordion.Trigger
            px="3r"
            py="2r"
            width="100%"
            textAlign="left"
            bg="colors.gray.100"
            border="1px solid"
            borderColor="ui.field.border"
            borderRadius="sm"
            cursor="pointer"
          >
            What is Reference UI?
          </Accordion.Trigger>
          <Accordion.Content p="3r" bg="colors.gray.50" borderRadius="sm" mt="1r">
            <Span fontSize="3r">
              A primitive-first component library with explicit composition and token-aware styling.
            </Span>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item id="item-2">
          <Accordion.Trigger
            px="3r"
            py="2r"
            width="100%"
            textAlign="left"
            bg="colors.gray.100"
            border="1px solid"
            borderColor="ui.field.border"
            borderRadius="sm"
            cursor="pointer"
            mt="1r"
          >
            How do StyleProps work?
          </Accordion.Trigger>
          <Accordion.Content p="3r" bg="colors.gray.50" borderRadius="sm" mt="1r">
            <Span fontSize="3r">
              StyleProps are camelCased, token-aware CSS props on generated HTML primitives.
            </Span>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item id="item-3">
          <Accordion.Trigger
            px="3r"
            py="2r"
            width="100%"
            textAlign="left"
            bg="colors.gray.100"
            border="1px solid"
            borderColor="ui.field.border"
            borderRadius="sm"
            cursor="pointer"
            mt="1r"
          >
            Why container queries?
          </Accordion.Trigger>
          <Accordion.Content p="3r" bg="colors.gray.50" borderRadius="sm" mt="1r">
            <Span fontSize="3r">
              Reference UI uses container queries instead of viewport breakpoints for responsive layout.
            </Span>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </Div>
  ),
  MultipleExpansion: () => (
    <Div maxW="100r">
      <Accordion expansion="multiple" defaultValue={['a', 'b']}>
        <Accordion.Item id="a">
          <Accordion.Trigger
            px="3r"
            py="2r"
            width="100%"
            textAlign="left"
            bg="colors.gray.100"
            border="1px solid"
            borderColor="ui.field.border"
            borderRadius="sm"
            cursor="pointer"
          >
            Section A
          </Accordion.Trigger>
          <Accordion.Content p="3r" mt="1r">
            <Span fontSize="3r">Multiple sections can stay open at once.</Span>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item id="b">
          <Accordion.Trigger
            px="3r"
            py="2r"
            width="100%"
            textAlign="left"
            bg="colors.gray.100"
            border="1px solid"
            borderColor="ui.field.border"
            borderRadius="sm"
            cursor="pointer"
            mt="1r"
          >
            Section B
          </Accordion.Trigger>
          <Accordion.Content p="3r" mt="1r">
            <Span fontSize="3r">Both A and B start expanded in this fixture.</Span>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </Div>
  ),
}
