import { type ReactNode, useState } from 'react'
import { Button, Div, Span } from '@reference-ui/react'
import './animation-demo.fragments'

/**
 * Live demo for the System > Animation page. Each tile runs one animation
 * token from `animation-demo.fragments.ts`; the fade tile remounts on Replay
 * so its one-shot animation can run again.
 */

function Tile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Div display="flex" flexDirection="column" alignItems="center" gap="3r" padding="4r">
      <Div display="flex" alignItems="center" justifyContent="center" height="12r">
        {children}
      </Div>
      <Span fontFamily="mono" fontSize="3.5r" color="docsMuted">
        {label}
      </Span>
    </Div>
  )
}

export function AnimationDemo() {
  const [replay, setReplay] = useState(0)

  return (
    <Div display="flex" flexWrap="wrap" alignItems="center" justifyContent="center" gap="4r">
      <Tile label="example.spin">
        <Div width="8r" height="8r" borderRadius="sm" bg="docsHighlight" animation="example.spin" />
      </Tile>
      <Tile label="example.spinFast">
        <Div width="8r" height="8r" borderRadius="sm" bg="docsHighlight" animation="example.spinFast" />
      </Tile>
      <Tile label="example.fade">
        <Div key={replay} width="8r" height="8r" borderRadius="sm" bg="docsHighlight" animation="example.fade" />
      </Tile>
      <Button
        type="button"
        onClick={() => setReplay(value => value + 1)}
        fontSize="3.5r"
        color="docsText"
        bg="docsActiveBg"
        borderWidth="0"
        borderRadius="md"
        paddingInline="3r"
        paddingBlock="1.5r"
        cursor="pointer"
        _hover={{ bg: 'docsHoverBg' }}
      >
        Replay fade
      </Button>
    </Div>
  )
}
