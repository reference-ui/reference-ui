// Shell fixture: it declares the interface the shell modes render plus the degenerate member-less one.
// No styled import here: the shell case must stay green regardless of the StyleProps indexing question.
// The never-record heritage keeps the interface member-less while satisfying the no-empty-interface lint.
export interface ReferenceApiFixture {
  label: string
  disabled?: boolean
  variant: 'solid' | 'ghost'
}

export interface ReferenceEmptyFixture extends Record<string, never> {}
