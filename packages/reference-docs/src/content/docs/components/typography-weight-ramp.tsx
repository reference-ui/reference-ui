import type { ReactNode } from 'react'
import { Div, Span } from '@reference-ui/react'

/**
 * Weight ramps for the Typography page, grouped by weight name so the three
 * families sit directly on top of each other for the same weight. Families and
 * weights are written out literally — the style engine extracts `font` and
 * `weight` from literal JSX, so a loop over data would drop them. The number
 * beside each family is the value that weight resolves to in that family.
 * `bold` is the heaviest shipped weight — none of the families ship `black`.
 */

const specStyle = {
  width: '28r',
  fontSize: 'sm',
  color: 'docsMuted',
  fontFamily: 'mono',
  whiteSpace: 'nowrap',
} as const

function FamilyLine({ spec, children }: { spec: string; children: ReactNode }) {
  return (
    <Div display="flex" alignItems="baseline" gap="4r">
      <Span {...specStyle}>{spec}</Span>
      {children}
    </Div>
  )
}

function WeightGroup({ name, children }: { name: string; children: ReactNode }) {
  return (
    <Div display="flex" flexDirection="column" gap="1r">
      <Span fontSize="sm" fontWeight="600" color="docsText">
        {name}
      </Span>
      {children}
    </Div>
  )
}

export function WeightRamp() {
  return (
    <Div display="flex" flexDirection="column" gap="6r">
      <WeightGroup name="thin">
        <FamilyLine spec="sans · 200">
          <Span font="sans" weight="thin" fontSize="6r" color="docsText">
            The quick brown fox
          </Span>
        </FamilyLine>
        <FamilyLine spec="serif · 200">
          <Span font="serif" weight="thin" fontSize="6r" color="docsText">
            The quick brown fox
          </Span>
        </FamilyLine>
        <FamilyLine spec="mono · 100">
          <Span font="mono" weight="thin" fontSize="6r" color="docsText">
            The quick brown fox
          </Span>
        </FamilyLine>
      </WeightGroup>

      <WeightGroup name="light">
        <FamilyLine spec="sans · 285">
          <Span font="sans" weight="light" fontSize="6r" color="docsText">
            The quick brown fox
          </Span>
        </FamilyLine>
        <FamilyLine spec="serif · 300">
          <Span font="serif" weight="light" fontSize="6r" color="docsText">
            The quick brown fox
          </Span>
        </FamilyLine>
        <FamilyLine spec="mono · 300">
          <Span font="mono" weight="light" fontSize="6r" color="docsText">
            The quick brown fox
          </Span>
        </FamilyLine>
      </WeightGroup>

      <WeightGroup name="normal">
        <FamilyLine spec="sans · 385">
          <Span font="sans" weight="normal" fontSize="6r" color="docsText">
            The quick brown fox
          </Span>
        </FamilyLine>
        <FamilyLine spec="serif · 373">
          <Span font="serif" weight="normal" fontSize="6r" color="docsText">
            The quick brown fox
          </Span>
        </FamilyLine>
        <FamilyLine spec="mono · 393">
          <Span font="mono" weight="normal" fontSize="6r" color="docsText">
            The quick brown fox
          </Span>
        </FamilyLine>
      </WeightGroup>

      <WeightGroup name="semibold">
        <FamilyLine spec="sans · 550">
          <Span font="sans" weight="semibold" fontSize="6r" color="docsText">
            The quick brown fox
          </Span>
        </FamilyLine>
        <FamilyLine spec="serif · 550">
          <Span font="serif" weight="semibold" fontSize="6r" color="docsText">
            The quick brown fox
          </Span>
        </FamilyLine>
        <FamilyLine spec="mono · 590">
          <Span font="mono" weight="semibold" fontSize="6r" color="docsText">
            The quick brown fox
          </Span>
        </FamilyLine>
      </WeightGroup>

      <WeightGroup name="bold">
        <FamilyLine spec="sans · 650">
          <Span font="sans" weight="bold" fontSize="6r" color="docsText">
            The quick brown fox
          </Span>
        </FamilyLine>
        <FamilyLine spec="serif · 633">
          <Span font="serif" weight="bold" fontSize="6r" color="docsText">
            The quick brown fox
          </Span>
        </FamilyLine>
        <FamilyLine spec="mono · 700">
          <Span font="mono" weight="bold" fontSize="6r" color="docsText">
            The quick brown fox
          </Span>
        </FamilyLine>
      </WeightGroup>
    </Div>
  )
}
