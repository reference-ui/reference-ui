// Entry for the CORE-CHAIN-15 upstream package, `@fixture/chain15`. It takes the package's own runtime and its Tile
// source and emits the two components an app imports: `Button`, the primitive re-exported from the package's own
// `@reference-ui/react`, and `Tile`. The spec builds this entry to `dist/`, the target `exports["."]` names, and the
// page resolves the package's `@reference-ui/react` to its own bound runtime, so every class they mint is the package's.
export { Button } from '@reference-ui/react'
export { Tile } from './Tile.js'
