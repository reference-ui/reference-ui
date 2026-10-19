// Live Slot demo for the Slot component page.
// It takes nothing and emits the slotted composition. Colocated with the page that embeds it.
import type { ReactNode } from 'react'
import { Button, Div, H3 } from '@reference-ui/react'
import { createSlotRootContext } from '@reference-ui/lib'

const CardSlots = createSlotRootContext()

function CardLayout() {
  const title = CardSlots.useSlot('title')
  const actions = CardSlots.useSlot('actions')
  return (
    <Div display="flex" flexDirection="column" gap="3r" padding="4r" border="1px solid" borderColor="docsBorder" borderRadius="md">
      {title?.element}
      {actions?.element}
    </Div>
  )
}

function Card({ children }: { children: ReactNode }) {
  return (
    <CardSlots.Provider>
      {children}
      <CardLayout />
    </CardSlots.Provider>
  )
}

function CardTitle({ children }: { children: ReactNode }) {
  CardSlots.useSlotRegistration({ slotId: 'title', element: <H3 margin="0">{children}</H3> })
  return null
}

function CardActions({ children }: { children: ReactNode }) {
  CardSlots.useSlotRegistration({ slotId: 'actions', element: <Div display="flex" gap="2r">{children}</Div> })
  return null
}

/** Actions are written first, but the layout renders the title first. */
export function SlotDemo() {
  return (
    <Card>
      <CardActions>
        <Button variant="primary">Publish</Button>
        <Button>Cancel</Button>
      </CardActions>
      <CardTitle>Publish this draft?</CardTitle>
    </Card>
  )
}
