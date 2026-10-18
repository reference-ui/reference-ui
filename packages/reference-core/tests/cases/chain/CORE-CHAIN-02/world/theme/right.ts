// Stand-in for the right branch package's published base system. It takes
// nothing and emits the right object the app config extends. Its named fragment
// list carries the same shared inner base node as the left branch, under the
// same name, plus its own disjoint branch-local leaf (E1, E2). No imports on
// purpose: the fragment scanner matches import sources textually, and this file
// is data for the config, not a fragment to evaluate.

const SHARED_BASE = 'tokens({ colors: { fixtureDemoAccent: { value: "#14b8a6" } } })'
const RIGHT_LEAF = 'tokens({ colors: { metaSiblingBg: { value: "#7c2d12" } } })'

export const right = {
  name: 'meta-extend-library-sibling',
  fragment: `${SHARED_BASE}; ${RIGHT_LEAF}`,
  fragments: [
    { name: 'meta-base', bundle: SHARED_BASE },
    { name: 'meta-extend-library-sibling', bundle: RIGHT_LEAF },
  ],
  jsxElements: ['MetaSiblingDemo', 'DemoComponent'],
}
