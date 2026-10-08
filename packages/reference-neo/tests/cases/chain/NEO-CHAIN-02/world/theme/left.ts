// Stand-in for the left branch package's published base system. It takes
// nothing and emits the left object the app config extends, with the shared
// inner base republished first and the branch-local leaf second. No imports
// on purpose: the fragment scanner matches import sources textually, and
// this file is data for the config, not a fragment to evaluate.

export const left = {
  name: 'meta-extend-library',
  fragment:
    'tokens({ colors: { fixtureDemoAccent: { value: "#14b8a6" } } }); ' +
    'tokens({ colors: { metaExtendBg: { value: "#312e81" } } })',
  jsxElements: ['MetaExtendDemo', 'DemoComponent'],
}
