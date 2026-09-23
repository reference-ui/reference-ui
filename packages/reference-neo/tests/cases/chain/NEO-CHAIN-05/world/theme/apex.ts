// Stand-in for the apex package's published base system. It takes nothing
// and emits the apex object the app config extends: the innermost base leaf
// first, the middle republish second, and the apex-local leaf last — the
// flattened bundle order a real depth-three publish produces. No imports on
// purpose: the fragment scanner matches import sources textually, and this
// file is data for the config, not a fragment to evaluate.

export const apex = {
  name: 'apex-extend-library',
  fragment:
    'tokens({ colors: { fixtureDemoBg: { value: "#0f172a" } } }); ' +
    'tokens({ colors: { metaExtendBg: { value: "#312e81" } } }); ' +
    'tokens({ colors: { apexBg: { value: "#4c1d95" } } })',
  jsxElements: ['ApexDemo', 'MetaExtendDemo', 'DemoComponent'],
}
