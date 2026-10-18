// Stand-in for the mid package's published base system. It extends the base, so its named fragment list
// carries the base's node first, then its own node. It overrides `accent`, a value the base also writes. No
// imports on purpose: the fragment scanner matches import sources textually, and this file is data for the
// config, not a fragment to evaluate.

const BASE_NODE = 'tokens({ colors: { brand: { value: "#aa0000" }, quiet: { value: "#777777" }, accent: { value: "#101010" } } })'
const MID_NODE = 'tokens({ colors: { accent: { value: "#202020" } } })'

export const baseSystem = {
  name: 'core-chain12-mid',
  fragment: `;${BASE_NODE}\n;${MID_NODE}`,
  fragments: [
    { name: 'core-chain12-base', bundle: BASE_NODE },
    { name: 'core-chain12-mid', bundle: MID_NODE },
  ],
  jsxElements: [],
}
