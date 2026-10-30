// Tone gallery specimen for the /diagram gallery.
// It takes nothing and emits the six semantic tones at resting intensity plus one tone
// across all four intensities, with the dashed notice-before-crossing boundary.
import {
  BoltIcon,
  CheckCircleIcon,
  DeployedCodeIcon,
  PaletteIcon,
  ShieldIcon,
  WidgetsIcon,
} from '@reference-ui/lib'
import type { ReactNode } from 'react'
import { Span, css } from '@reference-ui/react'
import { Diagram, type DiagramIntensity, type DiagramTone } from '../../components/diagram/Diagram'

/**
 * The tone vocabulary. Six semantic tones at the resting intensity, then the
 * same tone across the four intensities so the difference is legible. Tones
 * carry meaning — neutral structures, blue builds, green confirms, amber warns,
 * red blocks, violet transforms — and intensity decides how loudly. The dashed
 * outline draws a boundary the reader should notice before crossing.
 */

const cardName = css({
  fontSize: '4r',
  weight: 'sans.semibold',
  letterSpacing: '-0.01em',
  color: 'docsText',
  lineHeight: '1.3',
})

const cardUse = css({ fontSize: '3.5r', color: 'diagramMuted', lineHeight: '1.5' })

const toneIcon: Record<Exclude<DiagramTone, 'neutral'>, ReactNode> = {
  blue: <DeployedCodeIcon size="lg" color="diagramBlueText" />,
  green: <CheckCircleIcon size="lg" color="diagramGreenText" />,
  amber: <ShieldIcon size="lg" color="diagramAmberText" />,
  red: <BoltIcon size="lg" color="diagramRedText" />,
  violet: <PaletteIcon size="lg" color="diagramVioletText" />,
}

function ToneCard({
  tone,
  intensity,
  name,
  use,
}: {
  tone: DiagramTone
  intensity?: DiagramIntensity
  name: string
  use: string
}) {
  const icon =
    tone === 'neutral' ? (
      <WidgetsIcon size="lg" color="diagramMuted" />
    ) : (
      toneIcon[tone]
    )
  return (
    <Diagram.Panel tone={tone} intensity={intensity} align="center">
      {icon}
      <Span className={cardName}>{name}</Span>
      <Span className={cardUse}>{use}</Span>
    </Diagram.Panel>
  )
}

export function ToneGallery() {
  return (
    <Diagram>
      <Diagram.Row>
        <ToneCard tone="neutral" name="Neutral" use="Structure and grouping" />
        <ToneCard tone="blue" name="Blue" use="Build-time work" />
        <ToneCard tone="green" name="Green" use="Ready and healthy" />
      </Diagram.Row>
      <Diagram.Row>
        <ToneCard tone="amber" name="Amber" use="Boundaries and caution" />
        <ToneCard tone="red" name="Red" use="Blocked and destructive" />
        <ToneCard tone="violet" name="Violet" use="Transforms and derived state" />
      </Diagram.Row>
      <Diagram.Row>
        <ToneCard tone="amber" intensity="ghost" name="Ghost" use="Barely-there wash" />
        <ToneCard tone="amber" intensity="medium" name="Medium" use="The resting tint" />
        <ToneCard tone="amber" intensity="firm" name="Firm" use="A step above rest" />
        <ToneCard tone="amber" intensity="strong" name="Strong" use="Reads as coloured" />
      </Diagram.Row>
      <Diagram.Row>
        <Diagram.Panel variant="outline" align="center">
          <Span className={cardName}>Outline · neutral</Span>
          <Span className={cardUse}>Dashed grouping without emphasis</Span>
        </Diagram.Panel>
        <Diagram.Panel tone="amber" variant="outline" align="center">
          <ShieldIcon size="lg" color="diagramAmberText" />
          <Span className={cardName}>Outline · amber</Span>
          <Span className={cardUse}>A boundary with consequences</Span>
        </Diagram.Panel>
      </Diagram.Row>
    </Diagram>
  )
}
