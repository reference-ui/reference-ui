// Package-shape fixture: it declares one interface plus one alias so the background manifest is non-empty.
// REF-01 asserts the generated package layout around the manifest, not symbol content, so two symbols suffice.
// No styled import here: the shape case must stay green regardless of the StyleProps indexing question.
export interface ReferenceApiFixture {
  label: string
  disabled?: boolean
  variant: 'solid' | 'ghost'
}

export type ReferenceApiVariant = ReferenceApiFixture['variant']
