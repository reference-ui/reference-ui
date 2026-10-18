# NEO-REF-05 — reference runtime shell

Proves the shipped `Reference` shell renders every reachable state: `01-loading` stalls the symbol chunk
responses and asserts the loading text names its symbol before the document replaces it; `02-shell` asserts
the missing-symbol error names its symbol, the degenerate member-less interface renders a document (no error,
no empty text), the context hook loads through a provided runtime, and the hook without a provider throws
`ReferenceRuntimeProvider is required` onto the page.

> Search terms: runtime shell, loading state, error state, empty state, provider, runtime context, error boundary, NEO-REF-03

## Oracle mapping

`ReferenceStatus` plus `ReferenceRuntimeContext` (the entry-composed states and the provider pair). The empty
state is defensive-only and unreachable through the shipped runtime: `createReferenceDocument` is total, so a
successful load always produces a document and the shell can only show loading, error, or document. The case
pins that verdict by rendering the degenerate input as a document and asserting the empty text never appears.
