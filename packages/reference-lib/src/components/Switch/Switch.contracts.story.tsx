/**
 * Two uncontrolled switches expose their independent state and event ordering.
 * Parent rerenders and explicit remounts separate default values from live user state.
 */
import * as React from 'react'
import { Switch } from './index'

export function UncontrolledLifecycleFixture({ cancel = false }: { cancel?: boolean }) {
  const [initialChecked, setInitialChecked] = React.useState(false)
  const [showFirst, setShowFirst] = React.useState(true)
  const [events, setEvents] = React.useState<string[]>([])
  return (
    <>
      {showFirst && (
        <Switch
          aria-label="First preference"
          defaultChecked={initialChecked}
          onClick={event => {
            const checked = event.currentTarget.getAttribute('aria-checked')
            setEvents(previous => [...previous, `click:${checked}`])
            if (cancel) event.preventDefault()
          }}
          onChange={checked => setEvents(previous => [...previous, `change:${checked}`])}
        />
      )}
      <Switch aria-label="Second preference" defaultChecked />
      <button type="button" onClick={() => setInitialChecked(checked => !checked)}>
        Change first default
      </button>
      <button type="button" onClick={() => setShowFirst(show => !show)}>
        Toggle first mount
      </button>
      <output data-testid="switch-lifecycle-events">{JSON.stringify(events)}</output>
    </>
  )
}
