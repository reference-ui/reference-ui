import { useState } from 'react'
import { Button, Div, H2, P, css } from '@reference-ui/react'
import { Overlay } from '@reference-ui/lib'
import { floatingSurface } from './demo-surface'

const backdrop = css({ bg: 'rgba(0,0,0,0.5)' })

/** Centres the dialog; unbound Overlay content is positioned by your CSS. */
const centred = css({
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  minWidth: '75r',
})

/** A confirm dialog: isolating, unbound, opened from Overlay.Trigger. */
export function OverlayDemo() {
  const [open, setOpen] = useState(false)
  return (
    <Overlay open={open} onOpenChange={setOpen}>
      <Overlay.Trigger>Delete project</Overlay.Trigger>
      <Overlay.Backdrop className={backdrop} />
      <Overlay.Content
        role="dialog"
        aria-modal="true"
        aria-labelledby="overlay-demo-title"
        className={`${floatingSurface} ${centred}`}
      >
        <H2 id="overlay-demo-title" fontSize="4.5r" margin="0">
          Delete project?
        </H2>
        <P marginTop="2r">This removes the project and its history.</P>
        <Div display="flex" justifyContent="flex-end" gap="2r" marginTop="4r">
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => setOpen(false)}>
            Delete
          </Button>
        </Div>
      </Overlay.Content>
    </Overlay>
  )
}
