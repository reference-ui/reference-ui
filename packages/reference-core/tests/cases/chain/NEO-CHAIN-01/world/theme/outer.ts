// Stand-in for the outer package's published base system export. It takes
// nothing and emits the outer object the app config extends, with the inner
// base republished first and the outer-local leaves second — the portable
// bundle order a real transitive publish produces. No imports on purpose:
// the fragment scanner matches import sources textually, and this file is
// data for the config, not a fragment to evaluate.

export const outer = {
  name: 'meta-extend-library',
  fragment:
    'tokens({ colors: { fixtureDemoAccent: { value: "#14b8a6" } } }); ' +
    'tokens({ colors: { metaExtendBg: { value: "#312e81" }, metaExtendText: { value: "#e0e7ff" } } })',
  jsxElements: ['MetaExtendDemo', 'DemoComponent'],
}
