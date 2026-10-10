// badge.mjs — the NEO-CHAIN-08 prebuilt package component fixture. It is the
// shape a published dist ships: plain JS rendering a primitive from its own
// materialized, bound runtime (`upstream/.reference-ui/react/react.mjs`), so
// every style prop it forwards is qualified with the package's system name
// (`neo-chain8-up`) and never the consumer's. The consumer never scans this
// file — it lives outside the `src/**` extraction glob, exactly like a real
// prebuilt dist — so a style prop on it can only paint through fan-out.
import { createElement, Div } from '../upstream/.reference-ui/react/react.mjs'

export function Badge({ children, ...rest }) {
  return createElement(Div, rest, children)
}
