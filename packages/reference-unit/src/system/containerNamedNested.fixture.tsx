import { Div } from '@reference-ui/react'

/** Ancestor establishes `sidebar`; descendant uses `container="sidebar"` + `r` to query that name. */
export function SourceNamedNestedContainerQuery() {
  return (
    <Div container="sidebar">
      <Div
        container="sidebar"
        r={{
          400: { padding: '1rem', fontSize: '1.125rem' },
        }}
      >
        Named nested: query ancestor &quot;sidebar&quot;
      </Div>
    </Div>
  )
}
