/**
 * Tooltip contract harness: one fixture for the consumer and lifecycle
 * suite. Mounts controlled and cancellation variants so the contract
 * spec can pin description survival, prevention, controlled requests,
 * and unmount cleanup.
 */
import * as React from 'react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Tooltip } from './index'

export function Contracts({ controlled = false, cancel = false }: { controlled?: boolean; cancel?: boolean }) {
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(true)
  const [events, setEvents] = React.useState<string[]>([])
  const record = (event: string) => setEvents(previous => [...previous, event])

  return (
    <ReferenceLibrary tooltip={{ skipDelay: 0 }}>
      <p id="contract-description">Authored description</p>
      <button type="button" data-testid="before">Before</button>
      {mounted && (
        <Tooltip
          open={controlled ? open : undefined}
          openDelay={200}
          closeDelay={0}
          onOpen={() => record('open')}
          onDismiss={() => record('dismiss')}
          onOpenChange={value => record(`change:${value}`)}
        >
          <Tooltip.Trigger>
            <button
              type="button"
              data-testid="trigger"
              aria-describedby="contract-description"
              onPointerEnter={event => {
                record('consumer-enter')
                if (cancel) event.preventDefault()
              }}
              onFocus={event => {
                record('consumer-focus')
                if (cancel) event.preventDefault()
              }}
            >
              Contract tip
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content data-testid="content">Contract help</Tooltip.Content>
        </Tooltip>
      )}
      <button type="button" data-testid="set-open" onClick={() => setOpen(true)}>Set open</button>
      <button type="button" data-testid="set-closed" onClick={() => setOpen(false)}>Set closed</button>
      <button type="button" data-testid="toggle-mount" onClick={() => setMounted(value => !value)}>Toggle mount</button>
      <output data-testid="events">{events.join(',')}</output>
    </ReferenceLibrary>
  )
}
