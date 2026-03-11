import type { PackageDefinition } from '../package'
import { injectLayerName, type InjectLayerNameContext } from './inject-layer-name'

export type PostprocessContext = InjectLayerNameContext

type PostprocessStep = (
  targetDir: string,
  pkg: PackageDefinition,
  context: PostprocessContext
) => void

const STEPS: Record<string, PostprocessStep> = {
  injectLayerName,
}

/**
 * Run any post-build steps declared on the package (e.g. token replacement).
 * Called after bundle, before symlink. No-op if the package has no postprocess steps.
 */
export function runPostprocess(
  targetDir: string,
  pkg: PackageDefinition,
  context: PostprocessContext
): void {
  const steps = pkg.postprocess ?? []
  for (const name of steps) {
    const step = STEPS[name]
    if (step) step(targetDir, pkg, context)
  }
}
