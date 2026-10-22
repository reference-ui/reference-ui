/**
 * Hand-written stand-in for the synced `@reference-ui/styled` type surface. It declares only the
 * style props the styletrace suites (Rust and Vitest) resolve through, not the full set that
 * `ref sync` writes. Add a name here when a test needs it; this file is committed, so it is never
 * sync output: see fixtures/README.md.
 */
export type StyleProps = {
  color?: string
  backgroundColor?: string
  margin?: string
  weight?: string
  width?: string
  height?: string
}
