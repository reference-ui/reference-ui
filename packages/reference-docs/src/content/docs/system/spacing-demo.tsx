// Spacing rhythm ramp for the System spacing page.
// It takes nothing and emits the rhythm ramp specimen over the spacing scale. Colocated
// with the page that embeds it.
import type { ReactNode } from 'react'
import { Div, Span } from '@reference-ui/react'

/**
 * Rhythm ramp for the System > Spacing page. Each bar is a literal rhythm
 * width, so the compiler emits one root-relative rule per step and the ramp
 * shows the multiples side by side. Labels give the step and its computed
 * length at the default 0.25rem root.
 */

function Step({ label, length, children }: { label: string; length: string; children: ReactNode }) {
  return (
    <Div display="flex" alignItems="center" gap="4r">
      <Span width="12r" flexShrink="0" fontFamily="mono" fontSize="3.5r" color="docsText">
        {label}
      </Span>
      {children}
      <Span fontFamily="mono" fontSize="3.5r" color="docsMuted">
        {length}
      </Span>
    </Div>
  )
}

export function RhythmRamp() {
  return (
    <Div display="flex" flexDirection="column" gap="3r" width="100%">
      <Step label="1r" length="4px">
        <Div width="1r" height="4r" bg="docsHighlight" borderRadius="sm" />
      </Step>
      <Step label="2r" length="8px">
        <Div width="2r" height="4r" bg="docsHighlight" borderRadius="sm" />
      </Step>
      <Step label="4r" length="16px">
        <Div width="4r" height="4r" bg="docsHighlight" borderRadius="sm" />
      </Step>
      <Step label="8r" length="32px">
        <Div width="8r" height="4r" bg="docsHighlight" borderRadius="sm" />
      </Step>
      <Step label="16r" length="64px">
        <Div width="16r" height="4r" bg="docsHighlight" borderRadius="sm" />
      </Step>
      <Step label="32r" length="128px">
        <Div width="32r" height="4r" bg="docsHighlight" borderRadius="sm" />
      </Step>
    </Div>
  )
}
