// Externals policies for Neo packaging and shippable units.
// It takes nothing and emits the three module lists bundlers leave alone.
// The generated bundles externalize their host-provided edges; shippable units externalize nothing system-bound, so a packed fixture inlines its own runtime and resolves identically natively and hermetically.
// This file imports nothing, so fixture build configs can import the shippable policy directly. The types placeholder below duplicates the postprocess literal on purpose (same call, both sides cited) to keep this file a leaf.

/** React bundle externals: React rides with the consumer, never bundled. */
export const REACT_BUNDLE_EXTERNALS: string[] = ['react']

/** Types bundle externals: styled/types stay edges, node tooling stays host-side. */
export const TYPES_BUNDLE_EXTERNALS: string[] = [
  '__REFERENCE_UI_TYPES_RUNTIME__',
  'react',
  'react/jsx-runtime',
  '@reference-ui/styled',
  '@reference-ui/styled/*',
  '@reference-ui/types',
  '@reference-ui/types/*',
  'node:fs',
  'node:path',
  'node:crypto',
  'node:url',
  'url',
  'fast-glob',
  'esbuild',
]

/**
 * Shippable-unit externals: the HERMDIV fix as code. A packed system unit
 * (fixture dist) must resolve its runtime to its OWN system in every
 * environment, so it externalizes only the host-provided React edges and
 * inlines every `@reference-ui/*` import. No `@reference-ui/*` entry may
 * ever be added here: css() is system-bound, and a consumer-provided
 * bundle emits the consumer's classes for fixture components.
 */
export const SHIPPABLE_UNIT_EXTERNALS: string[] = ['react', 'react/jsx-runtime']
