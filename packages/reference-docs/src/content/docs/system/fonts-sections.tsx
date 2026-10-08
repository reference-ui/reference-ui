import type { ReactNode } from 'react'
import { Div, Span } from '@reference-ui/react'

/**
 * Font specimens for the System > Fonts page. Kept in a component (not MDX)
 * so the style props are statically extracted — inline JSX in MDX is not.
 */

function FamilyRow({ name, font, sample }: { name: string; font: 'sans' | 'serif' | 'mono'; sample: string }) {
  return (
    <Div
      bg="docsPanelBg"
      borderRadius="md"
      padding="4r"
      display="flex"
      flexDirection="column"
      gap="3r"
    >
      <Span fontSize="sm" fontWeight="600" color="docsMuted">
        {name}
      </Span>
      <Div font={font} fontSize="5r" lineHeight="1.3" color="docsText">
        {sample}
      </Div>
    </Div>
  )
}

export function ShippedFamilies() {
  const sample = 'The quick brown fox jumps over the lazy dog.'
  return (
    <Div
      display="grid"
      gridTemplateColumns="1fr"
      gap="4r"
      r={{ 640: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' } }}
    >
      <FamilyRow name="Sans · Inter" font="sans" sample={sample} />
      <FamilyRow name="Serif · Literata" font="serif" sample={sample} />
      <FamilyRow name="Mono · JetBrains Mono" font="mono" sample={sample} />
    </Div>
  )
}

const specStyle = {
  width: '34r',
  fontSize: 'sm',
  color: 'docsMuted',
  fontFamily: 'mono',
} as const

function WeightRow({ spec, children }: { spec: string; children: ReactNode }) {
  return (
    <Div display="flex" alignItems="baseline" gap="4r">
      <Span {...specStyle}>{spec}</Span>
      {children}
    </Div>
  )
}

export function FamilyWeights() {
  return (
    <Div display="flex" flexDirection="column" gap="3r">
      <WeightRow spec={'normal · sans → 385'}>
        <Span font="sans" weight="normal" fontSize="6r" color="docsText">
          The quick brown fox
        </Span>
      </WeightRow>
      <WeightRow spec={'normal · serif → 373'}>
        <Span font="serif" weight="normal" fontSize="6r" color="docsText">
          The quick brown fox
        </Span>
      </WeightRow>
      <WeightRow spec={'normal · mono → 393'}>
        <Span font="mono" weight="normal" fontSize="6r" color="docsText">
          The quick brown fox
        </Span>
      </WeightRow>
      <WeightRow spec={'thin · sans → 200'}>
        <Span font="sans" weight="thin" fontSize="6r" color="docsText">
          The quick brown fox
        </Span>
      </WeightRow>
      <WeightRow spec={'thin · no family → 100'}>
        <Span weight="thin" fontSize="6r" color="docsText">
          The quick brown fox
        </Span>
      </WeightRow>
    </Div>
  )
}
