export interface ReferenceApiFixture {
  label: string
  disabled?: boolean
  variant: 'solid' | 'ghost'
}

export type ReferenceApiVariant = ReferenceApiFixture['variant']

export * from './fixtures/docsReference.fixture'
export * from './fixtures/jsdocTags.fixture'