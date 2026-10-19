// Entry for the CORE-CHAIN-16 upstream package, `@fixture/chain16`. It takes the package's own runtime and its Tile
// source and emits the two components the app imports: `Button`, the primitive re-exported from the package's own
// `@reference-ui/react`, and `Tile`. The spec builds it to `dist/`, the target `exports["."]` names.
export { Button } from '@reference-ui/react'
export { Tile } from './Tile.js'
