// API fixture barrel: it declares the local interface plus the indexed-access alias the query specs pin.
// It re-exports the docs and JSDoc corpora so one module carries the whole oracle symbol set.
// Ported from the matrix oracle; only the file layout is neo (flat world sources, no matrix src tree).
export interface ReferenceApiFixture {
  label: string
  disabled?: boolean
  variant: 'solid' | 'ghost'
}

export type ReferenceApiVariant = ReferenceApiFixture['variant']

export * from './fixtures/docsReference.fixture.ts'
export * from './fixtures/jsdocTags.fixture.ts'
