/**
 * Native button contract fixtures use real forms and browser keyboard activation.
 * Event logs expose submitter identity and consumer cancellation without changing button styling.
 */
import * as React from 'react'
import { Button } from '@reference-ui/react'

export function NativeFormFixture({
  cancelClick = false,
  cancelKeyboard = false,
}: {
  cancelClick?: boolean
  cancelKeyboard?: boolean
}) {
  const [events, setEvents] = React.useState<string[]>([])
  const [submission, setSubmission] = React.useState('none')

  return (
    <form
      data-testid="button-native-form"
      onSubmit={event => {
        event.preventDefault()
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement
        setEvents(previous => [...previous, 'submit'])
        setSubmission(JSON.stringify({
          submitter: submitter.id,
          entries: Array.from(new FormData(event.currentTarget, submitter).entries()),
        }))
      }}
    >
      <label htmlFor="button-contract-email">Email</label>
      <input id="button-contract-email" name="email" type="email" required />
      <Button
        id="button-contract-save"
        name="command"
        value="save"
        onClick={event => {
          setEvents(previous => [...previous, 'click'])
          if (cancelClick) event.preventDefault()
        }}
        onKeyDown={event => {
          if (cancelKeyboard && (event.key === 'Enter' || event.key === ' ')) {
            setEvents(previous => [...previous, `cancel:${event.key}`])
            event.preventDefault()
          }
        }}
      >
        Save changes
      </Button>
      <Button type="button">Preview changes</Button>
      <output data-testid="button-contract-events">{JSON.stringify(events)}</output>
      <output data-testid="button-contract-submission">{submission}</output>
    </form>
  )
}

export function ExternalFormFixture() {
  const [submitted, setSubmitted] = React.useState('none')
  return (
    <>
      <form
        id="button-external-owner"
        onSubmit={event => {
          event.preventDefault()
          const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement
          setSubmitted(JSON.stringify(Array.from(new FormData(event.currentTarget, submitter).entries())))
        }}
      >
        <label htmlFor="button-external-note">Note</label>
        <input id="button-external-note" name="note" defaultValue="Original" />
      </form>
      <Button type="submit" form="button-external-owner" name="command" value="publish">
        Publish note
      </Button>
      <Button type="reset" form="button-external-owner">Reset note</Button>
      <output data-testid="button-external-submission">{submitted}</output>
    </>
  )
}

export function NativeKeyboardFixture() {
  const [events, setEvents] = React.useState<string[]>([])
  return (
    <>
      <Button
        type="button"
        aria-label="Activate shortcut"
        onClick={event => setEvents(previous => [...previous, `click:${event.detail}`])}
      >
        <span aria-hidden="true">★</span>
      </Button>
      <fieldset disabled>
        <legend>Unavailable actions</legend>
        <Button type="button" onClick={() => setEvents(previous => [...previous, 'disabled'])}>
          Disabled by group
        </Button>
      </fieldset>
      <Button type="button">After disabled group</Button>
      <output data-testid="button-keyboard-events">{JSON.stringify(events)}</output>
    </>
  )
}
