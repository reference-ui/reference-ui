import { ComputerIcon, KeyIcon, LaptopMacIcon, MonitorIcon } from '@reference-ui/lib'
import { Div, Span, css } from '@reference-ui/react'
import { Diagram } from '../../components/diagram/Diagram'

/**
 * A licence with two seats. Green carries the activated state — tinted
 * seats, icons, and inset pills — while the limit note stays neutral: informative,
 * not alarming. The title row inside the last panel is an ordinary Div;
 * panels nest layout freely.
 */

const cardTitle = css({
  fontSize: '5r',
  fontWeight: '600',
  letterSpacing: '-0.01em',
  color: 'docsText',
  lineHeight: '1.3',
})

const cardSub = css({ fontSize: 'sm', color: 'diagramMuted', lineHeight: '1.5' })

const keyChip = css({
  fontFamily: 'mono',
  fontSize: '4r',
  color: 'docsText',
  letterSpacing: '0.04em',
  lineHeight: '1.4',
})

const pillGreen = css({
  fontSize: 'sm',
  fontWeight: '600',
  color: 'diagramGreenText',
  bg: 'diagramChip',
  paddingX: '3r',
  paddingY: '1r',
  borderRadius: 'full',
  lineHeight: '1.4',
})

const machineName = css({
  fontSize: '4r',
  fontWeight: '600',
  letterSpacing: '-0.01em',
  color: 'docsText',
  lineHeight: '1.3',
})

const titleRow = css({ display: 'flex', alignItems: 'center', gap: '2r' })

const limitTitle = css({
  fontSize: '4r',
  fontWeight: '600',
  letterSpacing: '-0.01em',
  color: 'docsText',
  lineHeight: '1.3',
})

export function LicenseGallery() {
  return (
    <Diagram>
      <Diagram.Column>
        <Diagram.Panel align="center">
          <KeyIcon size="lg" color="docsText" />
          <Span className={cardTitle}>Atrium Licence</Span>
          <Span className={keyChip}>XXXX-XXXX-XXXX-XXXX</Span>
          <Span className={pillGreen}>2 activations allowed</Span>
        </Diagram.Panel>

        <Diagram.Row>
          <Diagram.Panel tone="green" align="center">
            <ComputerIcon size="lg" color="diagramGreenText" />
            <Span className={machineName}>Studio PC</Span>
            <Span className={pillGreen}>Activated</Span>
            <Span className={cardSub}>Windows</Span>
          </Diagram.Panel>
          <Diagram.Panel tone="green" align="center">
            <LaptopMacIcon size="lg" color="diagramGreenText" />
            <Span className={machineName}>MacBook</Span>
            <Span className={pillGreen}>Activated</Span>
            <Span className={cardSub}>macOS</Span>
          </Diagram.Panel>
        </Diagram.Row>

        <Diagram.Panel align="center">
          <Div className={titleRow}>
            <MonitorIcon size="md" color="diagramMuted" />
            <Span className={limitTitle}>Third computer</Span>
          </Div>
          <Span className={cardSub}>Activation limit reached. Deactivate an existing machine first.</Span>
        </Diagram.Panel>
      </Diagram.Column>
    </Diagram>
  )
}
