// Stand-in for the second chain endpoint's published base system. It takes
// nothing and emits the chain-2 object the app config extends, with the
// second inner base republished first and the endpoint-local leaf second.
// Its leaves stay disjoint from chain 1 so each path proves independently.
// No imports on purpose: this file is config data, not a fragment to scan.

export const chain2 = {
  name: 'meta-extend-library-2',
  fragment:
    'tokens({ colors: { secondaryDemoAccent: { value: "#34d399" } } }); ' +
    'tokens({ colors: { metaExtend2Bg: { value: "#365314" } } })',
  jsxElements: ['MetaExtend2Demo', 'SecondaryDemoComponent'],
}
