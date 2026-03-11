import type { BaseSystem } from '../../types'
import type { CollectorBundles, FragmentBundle } from '../../lib/fragments'

export interface PreparedBaseFragments {
  upstreamFragments: string[]
  localFragmentBundles: FragmentBundle[]
}

export interface BaseArtifacts {
  collectorBundle: CollectorBundles
  baseSystem: BaseSystem
}
