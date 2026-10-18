// chain15.mjs — the CORE-CHAIN-15 prebuilt package fixture. It is the shape a published dist ships: plain JS that
// re-exports the primitive `Button` from its own materialized, bound runtime (`upstream/.reference-ui/react/react.mjs`)
// and renders `Tile` through that runtime's `Div`. Every style prop either one forwards is qualified with the package's
// system name (`core-chain15-up`), never the app's. The app never scans this file: it lives outside the `src/**`
// extraction glob, exactly like an installed package, so `Button` here shares only its name with the app's own primitive.
import { createElement, Div } from '../upstream/.reference-ui/react/react.mjs'

export { Button } from '../upstream/.reference-ui/react/react.mjs'

export function Tile({ children, ...rest }) {
  return createElement(Div, rest, children)
}
