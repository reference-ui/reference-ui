import { useState } from 'react'
import { Button, Div, H2, P, Span, css } from '@reference-ui/react'
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

/** Square top corners for a sheet bound to the bottom edge. */
const sheet = css({
  borderBottomLeftRadius: '0',
  borderBottomRightRadius: '0',
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

/** A bottom sheet: `edge` binds Content to the viewport, Handle drags it away. */
export function OverlaySheetDemo() {
  const [open, setOpen] = useState(false)
  return (
    <Overlay open={open} onOpenChange={setOpen} edge="bottom">
      <Overlay.Trigger>Open sheet</Overlay.Trigger>
      <Overlay.Backdrop className={backdrop} />
      <Overlay.Content
        role="dialog"
        aria-modal="true"
        aria-label="Share"
        offset={0}
        className={`${floatingSurface} ${sheet}`}
      >
        <Overlay.Handle />
        <P margin="0">Drag the handle down, press Escape, or click outside to close.</P>
        <Div display="flex" justifyContent="flex-end" marginTop="4r">
          <Button onClick={() => setOpen(false)}>Done</Button>
        </Div>
      </Overlay.Content>
    </Overlay>
  )
}

/** A panel anchored to its Trigger: `isolation={false}` makes Trigger the anchor. */
export function OverlayAnchoredDemo() {
  const [open, setOpen] = useState(false)
  return (
    <Overlay open={open} onOpenChange={setOpen} isolation={false}>
      <Overlay.Trigger>Show details</Overlay.Trigger>
      <Overlay.Content placement="bottom-start" className={floatingSurface}>
        <Span>Anchored below the trigger. Tab moves in; Escape closes.</Span>
      </Overlay.Content>
    </Overlay>
  )
}
