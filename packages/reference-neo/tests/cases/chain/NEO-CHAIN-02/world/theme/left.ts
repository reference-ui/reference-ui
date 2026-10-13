// Stand-in for the left branch package's published base system. It takes
// nothing and emits the left object the app config extends. Its named fragment
// list carries the shared inner base as its own node, first, and the branch-local
// leaf second, the shape a real publish produces (E1). No imports on purpose: the
// fragment scanner matches import sources textually, and this file is data for
// the config, not a fragment to evaluate.

const SHARED_BASE = 'tokens({ colors: { fixtureDemoAccent: { value: "#14b8a6" } } })'
const LEFT_LEAF = 'tokens({ colors: { metaExtendBg: { value: "#312e81" } } })'

export const left = {
  name: 'meta-extend-library',
  fragment: `${SHARED_BASE}; ${LEFT_LEAF}`,
  fragments: [
    { name: 'meta-base', bundle: SHARED_BASE },
    { name: 'meta-extend-library', bundle: LEFT_LEAF },
  ],
  jsxElements: ['MetaExtendDemo', 'DemoComponent'],
}
