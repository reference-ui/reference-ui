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
import { Diagram, type DiagramEmphasis, type DiagramTone } from '../../components/diagram/Diagram'

/**
 * The tone vocabulary. Six semantic tones at the default intensity, then the
 * same tone across the three intensities so the difference is legible. Tones
 * carry meaning — neutral structures, blue builds, green confirms, amber warns,
 * red blocks, violet transforms — and intensity decides how loudly. The dashed
 * outline draws a boundary the reader should notice before crossing.
 */

const cardName = css({
  fontSize: '4r',
  fontWeight: '600',
  letterSpacing: '-0.01em',
  color: 'docsText',
  lineHeight: '1.3',
})

const cardUse = css({ fontSize: 'sm', color: 'docsMuted', lineHeight: '1.5' })

const toneIcon: Record<Exclude<DiagramTone, 'neutral'>, ReactNode> = {
  blue: <DeployedCodeIcon size="lg" className={css({ color: 'diagramBlueText' })} />,
  green: <CheckCircleIcon size="lg" className={css({ color: 'diagramGreenText' })} />,
  amber: <ShieldIcon size="lg" className={css({ color: 'diagramAmberText' })} />,
  red: <BoltIcon size="lg" className={css({ color: 'diagramRedText' })} />,
  violet: <PaletteIcon size="lg" className={css({ color: 'diagramVioletText' })} />,
}

function ToneCard({
  tone,
  emphasis,
  name,
  use,
}: {
  tone: DiagramTone
  emphasis?: DiagramEmphasis
  name: string
  use: string
}) {
  const icon =
    tone === 'neutral' ? (
      <WidgetsIcon size="lg" className={css({ color: 'docsMuted' })} />
    ) : (
      toneIcon[tone]
    )
  return (
    <Diagram.Panel tone={tone} emphasis={emphasis} align="center">
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
        <ToneCard tone="amber" emphasis="subtle" name="Subtle" use="The default tint" />
        <ToneCard tone="amber" emphasis="moderate" name="Moderate" use="Worth a glance" />
        <ToneCard tone="amber" emphasis="strong" name="Strong" use="Demands the eye" />
      </Diagram.Row>
      <Diagram.Row>
        <Diagram.Panel variant="outline" align="center">
          <Span className={cardName}>Outline · neutral</Span>
          <Span className={cardUse}>Dashed grouping without emphasis</Span>
        </Diagram.Panel>
        <Diagram.Panel tone="amber" variant="outline" align="center">
          <ShieldIcon size="lg" className={css({ color: 'diagramAmberText' })} />
          <Span className={cardName}>Outline · amber</Span>
          <Span className={cardUse}>A boundary with consequences</Span>
        </Diagram.Panel>
      </Diagram.Row>
    </Diagram>
  )
}
