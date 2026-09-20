// Stand-in for an installed upstream package's base system export. It takes
// nothing and emits the upstream object the config extends. No imports on
// purpose: the fragment scanner matches import sources textually, and this
// file is data for the config, not a fragment to evaluate.

export const upstream = {
  name: 'upstream-lib',
  fragment:
    'tokens({ colors: { up: { value: "#ffffff" }, _private: { upstreamSecret: { value: "#999999" } } }, _private: { vault: { value: "#123456" } } })',
}
