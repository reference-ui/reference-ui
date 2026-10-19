// Live Portal demo for the Portal component page.
// It takes nothing and emits the out-of-tree render. Colocated with the page that embeds it.
import { useRef, useState } from 'react'
import { Button, Div, Span } from '@reference-ui/react'
import { Portal } from '@reference-ui/lib'
import { demoNote, floatingSurface } from './demo-surface'

/** Content declared in the left box renders into the right box through a ref. */
export function PortalDemo() {
  const [moved, setMoved] = useState(false)
  const destination = useRef<HTMLDivElement>(null)
  return (
    <Div display="flex" flexWrap="wrap" alignItems="flex-start" gap="4r">
      <Div display="flex" flexDirection="column" gap="2r">
        <Span className={demoNote}>Declared here</Span>
        <Button onClick={() => setMoved(value => !value)}>
          {moved ? 'Remove' : 'Render in the other box'}
        </Button>
        {moved ? (
          <Portal container={destination}>
            <Div className={floatingSurface}>Rendered through a portal.</Div>
          </Portal>
        ) : null}
      </Div>
      <Div display="flex" flexDirection="column" gap="2r" minWidth="60r">
        <Span className={demoNote}>Lands here</Span>
        <Div ref={destination} minHeight="12r" />
      </Div>
    </Div>
  )
}
