export interface ReferenceApiFixture {
  label: string
  disabled?: boolean
  variant: 'solid' | 'ghost'
}

export type ReferenceApiVariant = ReferenceApiFixture['variant']
