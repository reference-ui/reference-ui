// Barrel for the Neo-owned fragment collector seam.
// It takes nothing and re-exports collectors plus scan, bundle, and collect.
// Config templating helpers deliberately do not come across.

export { createFragmentCollector, createFragmentFunction } from './collector.ts'
export { scanForFragments, scanFragmentSources } from './scanner.ts'
export type { FragmentScan, ScannedSource } from './scanner.ts'
export { bundleFragments, collectFragments } from './runner.ts'
export { CONFIG_FRAGMENT_SOURCE_PROPERTY } from './types.ts'
export type {
  FragmentBundle,
  BundleFragmentsOptions,
  FragmentCollector,
  FragmentCollectorConfig,
  ScanOptions,
  CollectOptions,
  CollectOptionsPlanner,
} from './types.ts'
