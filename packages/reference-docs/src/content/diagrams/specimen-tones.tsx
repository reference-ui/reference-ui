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
import { Diagram, type DiagramTone } from '../../components/diagram/Diagram'

/**
 * Every panel tone and both variants. Tones carry meaning, not decoration:
 * neutral structures, blue builds, green confirms, amber warns, red blocks,
 * violet transforms. The outline variant draws dashed zones — boundaries the
 * reader should notice before crossing.
 */

const cardName = css({
  fontSize: '4r',
  fontWeight: '600',
  letterSpacing: '-0.01em',
  color: 'docsText',
  lineHeight: '1.3',
})

const cardUse = css({ fontSize: 'sm', color: 'docsMuted', lineHeight: '1.5' })

function ToneCard({
  tone,
  icon,
  name,
  use,
}: {
  tone: DiagramTone
  icon: ReactNode
  name: string
  use: string
}) {
  return (
    <Diagram.Panel tone={tone} align="center">
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
        <ToneCard
          tone="neutral"
          icon={<WidgetsIcon size="lg" color="docsMuted" />}
          name="Neutral"
          use="Structure and grouping"
        />
        <ToneCard
          tone="blue"
          icon={<DeployedCodeIcon size="lg" color="diagramBlueText" />}
          name="Blue"
          use="Build-time work"
        />
        <ToneCard
          tone="green"
          icon={<CheckCircleIcon size="lg" color="diagramGreenText" />}
          name="Green"
          use="Ready and healthy"
        />
      </Diagram.Row>
      <Diagram.Row>
        <ToneCard
          tone="amber"
          icon={<ShieldIcon size="lg" color="diagramAmberText" />}
          name="Amber"
          use="Boundaries and caution"
        />
        <ToneCard
          tone="red"
          icon={<BoltIcon size="lg" color="diagramRedText" />}
          name="Red"
          use="Blocked and destructive"
        />
        <ToneCard
          tone="violet"
          icon={<PaletteIcon size="lg" color="diagramVioletText" />}
          name="Violet"
          use="Transforms and derived state"
        />
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
