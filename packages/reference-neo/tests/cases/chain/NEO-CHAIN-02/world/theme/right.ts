// Stand-in for the right branch package's published base system. It takes
// nothing and emits the right object the app config extends, republishing
// the same shared inner base as the left branch plus its own disjoint
// branch-local leaf. No imports on purpose: the fragment scanner matches
// import sources textually, and this file is data for the config, not a
// fragment to evaluate.

export const right = {
  name: 'meta-extend-library-sibling',
  fragment:
    'tokens({ colors: { fixtureDemoAccent: { value: "#14b8a6" } } }); ' +
    'tokens({ colors: { metaSiblingBg: { value: "#7c2d12" } } })',
  jsxElements: ['MetaSiblingDemo', 'DemoComponent'],
}
