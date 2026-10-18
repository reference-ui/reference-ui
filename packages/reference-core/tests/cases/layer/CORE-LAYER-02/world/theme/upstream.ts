// Stand-in for an installed upstream package's base system export. It takes
// nothing and emits the upstream object the config extends. No imports on
// purpose: the fragment scanner matches import sources textually, and this
// file is data for the config, not a fragment to evaluate.

export const upstream = {
  name: 'upstream',
  fragment: 'tokens({ colors: { brass: { value: "#b58900" } } })',
  jsxElements: ['UpstreamCard'],
}
