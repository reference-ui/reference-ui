// Live FocusLock demo for the FocusLock component page.
// It takes nothing and emits the trapped-focus region. Colocated with the page that embeds it.
import { useState } from 'react'
import { Button, Div, Input } from '@reference-ui/react'
import { FocusLock } from '@reference-ui/lib'
import { demoNote, floatingSurface } from './demo-surface'

/** A panel that holds focus while it is open and hands it back when it closes. */
export function FocusLockDemo() {
  const [locked, setLocked] = useState(false)
  return (
    <Div display="flex" flexDirection="column" alignItems="center" gap="3r">
      <Button onClick={() => setLocked(true)}>
        Start lock
      </Button>
      {locked ? (
        <FocusLock>
          <Div
            role="group"
            aria-label="Locked panel"
            display="flex"
            flexDirection="column"
            gap="2r"
            className={floatingSurface}
          >
            <Input placeholder="Name" />
            <Input placeholder="Email" />
            <Button onClick={() => setLocked(false)}>End lock</Button>
          </Div>
        </FocusLock>
      ) : (
        <Div className={demoNote}>Tab stays inside the panel until you end the lock.</Div>
      )}
    </Div>
  )
}
