import { Div } from '@reference-ui/react'

/** Outer establishes anonymous container; inner uses `r` only (queries nearest ancestor). */
export function SourceNestedContainerQuery() {
  return (
    <Div container>
      <Div
        r={{
          300: { padding: '0.5rem' },
          600: { padding: '1.5rem' },
        }}
      >
        Nested anonymous container query source fixture
      </Div>
    </Div>
  )
}
