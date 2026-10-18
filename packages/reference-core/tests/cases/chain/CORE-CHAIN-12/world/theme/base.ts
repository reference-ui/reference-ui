// Stand-in for the base package's published base system. It takes nothing and emits the base object the app
// config extends: three tokens, in one named node. No imports on purpose: the fragment scanner matches import
// sources textually, and this file is data for the config, not a fragment to evaluate.

const BASE_NODE = 'tokens({ colors: { brand: { value: "#aa0000" }, quiet: { value: "#777777" }, accent: { value: "#101010" } } })'

export const baseSystem = {
  name: 'core-chain12-base',
  fragment: `;${BASE_NODE}`,
  fragments: [{ name: 'core-chain12-base', bundle: BASE_NODE }],
  jsxElements: [],
}
