// Stand-in for the first chain endpoint's published base system. It takes
// nothing and emits the chain-1 object the app config extends, with the
// first inner base republished first and the endpoint-local leaf second. No
// imports on purpose: the fragment scanner matches import sources textually,
// and this file is data for the config, not a fragment to evaluate.

export const chain1 = {
  name: 'meta-extend-library',
  fragment:
    'tokens({ colors: { fixtureDemoAccent: { value: "#14b8a6" } } }); ' +
    'tokens({ colors: { metaExtendBg: { value: "#312e81" } } })',
  jsxElements: ['MetaExtendDemo', 'DemoComponent'],
}
