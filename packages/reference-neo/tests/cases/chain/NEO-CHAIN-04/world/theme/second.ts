// Stand-in for the second direct upstream's published base system. It takes
// nothing and emits the second object the app config extends: the secondary
// triple plus the shared order leaf at the winning value, since later
// extends entries win scalar conflicts. No imports on purpose: this file is
// config data, not a fragment to scan.

export const second = {
  name: 'extend-library-2',
  fragment:
    'tokens({ colors: { secondaryDemoBg: { value: "#064e3b" }, secondaryDemoText: { value: "#d1fae5" }, secondaryDemoAccent: { value: "#34d399" }, orderMark: { value: "#222222" } } })',
  jsxElements: ['SecondaryDemoComponent'],
}
