// Stand-in for the first direct upstream's published base system. It takes
// nothing and emits the first object the app config extends: the demo
// triple plus the shared order leaf at the losing value. No imports on
// purpose: the fragment scanner matches import sources textually, and this
// file is data for the config, not a fragment to evaluate.

export const first = {
  name: 'extend-library',
  fragment:
    'tokens({ colors: { fixtureDemoBg: { value: "#0f172a" }, fixtureDemoText: { value: "#f8fafc" }, fixtureDemoAccent: { value: "#14b8a6" }, orderMark: { value: "#111111" } } })',
  jsxElements: ['DemoComponent'],
}
