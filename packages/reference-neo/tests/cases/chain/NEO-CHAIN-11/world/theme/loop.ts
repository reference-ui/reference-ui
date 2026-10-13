// Stand-in for an upstream base system whose published fragment list names the consumer. It takes
// nothing and emits the loop object the app config extends. The consumer's own name is one of the
// loop's fragment nodes and no stream reaches it, so the cycle is visible through fragment names
// alone. No imports on purpose: the fragment scanner matches import sources textually, and this file
// is data for the config, not a fragment to evaluate.

const OWNER_NODE = 'tokens({ colors: { ownerBg: { value: "#654321" } } })'
const LOOP_NODE = 'tokens({ colors: { loopBg: { value: "#123456" } } })'

export const baseSystem = {
  name: 'neo-chain11-loop',
  fragment: `;${OWNER_NODE}\n;${LOOP_NODE}`,
  fragments: [
    { name: 'neo-chain11', bundle: OWNER_NODE },
    { name: 'neo-chain11-loop', bundle: LOOP_NODE },
  ],
  jsxElements: [],
}
