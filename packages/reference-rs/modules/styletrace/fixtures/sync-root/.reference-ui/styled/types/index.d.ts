/**
 * Hand-written stand-in for the synced `@reference-ui/styled` type surface. It declares only the
 * style props the styletrace stations resolve through, not the full set that `ref sync` writes.
 * Add a name here when a station needs it; this file is committed, so it is never sync output.
 */
export type StyleProps = {
  color?: string
  weight?: string
  width?: string
  height?: string
}
