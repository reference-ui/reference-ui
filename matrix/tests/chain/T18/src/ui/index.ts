/**
 * A project barrel that re-exports a package's primitive (plan probe 2). The
 * relative hop must surface the bare specifier at its end, so a tag imported
 * through `./ui` keeps the package's provenance.
 */
export { Button } from '@reference-ui/lib/primitives'
