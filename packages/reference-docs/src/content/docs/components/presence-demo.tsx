// Live Presence demo for the Presence component page.
// It takes nothing and emits the mount/unmount transition. Colocated with the page that
// embeds it.
import { useState } from 'react'
import { Button, Div, css } from '@reference-ui/react'
import { Presence } from '@reference-ui/lib'
import { floatingSurface } from './demo-surface'

const fade = css({
  transition: 'opacity 0.3s ease',
  opacity: '1',
  '&[data-state="closed"]': { opacity: '0' },
})

/** A panel that fades out before it unmounts. */
export function PresenceDemo() {
  const [open, setOpen] = useState(true)
  return (
    <Div display="flex" flexDirection="column" alignItems="center" gap="3r">
      <Button onClick={() => setOpen(value => !value)}>{open ? 'Hide' : 'Show'}</Button>
      <Presence present={open}>
        <Div data-state={open ? 'open' : 'closed'} className={`${floatingSurface} ${fade}`}>
          Fades before it leaves the DOM.
        </Div>
      </Presence>
    </Div>
  )
}
