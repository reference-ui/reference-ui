/**
 * Module re-export edge cases test case.
 * Covers various re-export patterns including type-only, mixed, star-as, default-as-named,
 * barrel exports, circular re-exports, and ambient modules.
 */

export type {
  ReexportTypeOnly,
  ReexportMixed,
  ReexportStarAs,
  ReexportDefaultAsNamed,
  BarrelDeep,
  CircularReexport,
  AmbientModule,
} from './reexport-patterns'

export { Foo, Bar, default as Baz } from './source-module'
export type { TypeA, TypeB } from './type-module'
export * as NS from './namespace-module'
