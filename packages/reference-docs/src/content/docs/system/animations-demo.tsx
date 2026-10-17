import { type ReactNode, useState } from 'react'
import { Button, Div, Span } from '@reference-ui/react'

/**
 * Animation token sampler. Each tile runs a named token (`spin.slow`,
 * `pulse.normal`, …) so the bundled keyframe + duration + easing is visible.
 */
function Tile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Div
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap="3r"
      padding="4r"
      borderRadius="md"
      bg="docsPanelBg"
    >
      <Div display="flex" alignItems="center" justifyContent="center" height="14r">
        {children}
      </Div>
      <Span fontSize="0.75rem" fontFamily="mono" color="docsMuted">
        {label}
      </Span>
    </Div>
  )
}

export function AnimationsDemo() {
  const [replay, setReplay] = useState(0)

  return (
    <Div display="flex" flexDirection="column" gap="6r">
      <Div
        display="grid"
        gridTemplateColumns="repeat(auto-fill, minmax(150px, 1fr))"
        gap="4r"
      >
        <Tile label="spin.slow">
          <Div width="10r" height="10r" borderRadius="md" bg="docsHighlight" animation="spin.slow" />
        </Tile>
        <Tile label="pulse.normal">
          <Div width="10r" height="10r" borderRadius="md" bg="docsHighlight" animation="pulse.normal" />
        </Tile>
        <Tile label="bounce.fast">
          <Div width="10r" height="10r" borderRadius="md" bg="docsHighlight" animation="bounce.fast" />
        </Tile>
        <Tile label="ping.normal">
          <Div width="10r" height="10r" borderRadius="md" bg="docsHighlight" animation="ping.normal" />
        </Tile>
        <Tile label="fadeIn.normal">
          <Div
            key={replay}
            width="10r"
            height="10r"
            borderRadius="md"
            bg="docsHighlight"
            animation="fadeIn.normal"
          />
        </Tile>
      </Div>

      <Div>
        <Button onClick={() => setReplay(value => value + 1)}>Replay fade</Button>
      </Div>
    </Div>
  )
}
