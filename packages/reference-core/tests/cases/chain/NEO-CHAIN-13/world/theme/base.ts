// Stand-in for the base package's published base system. It takes nothing and emits the base object the app
// config extends: one mode leaf, `icon`, with a light and a dark value. No imports on purpose: the fragment
// scanner matches import sources textually, and this file is data for the config, not a fragment to evaluate.

const BASE_NODE = 'tokens({ colors: { icon: { light: "#111111", dark: "#eeeeee" } } })'

export const baseSystem = {
  name: 'neo-chain13-base',
  fragment: `;${BASE_NODE}`,
  fragments: [{ name: 'neo-chain13-base', bundle: BASE_NODE }],
  jsxElements: [],
}
