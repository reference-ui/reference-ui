// Postprocess registry for Neo packaged bundles.
// It takes bundle code plus a package definition and emits the code after running the definition's named passes in order.
// Passes stay pure string transforms — the legs hold the single file write — so each pass unit-pins without touching the filesystem.

import type { PackageDefinition } from '../package/index.ts'
import { rewriteTypesRuntimeImport } from './rewrite-types-runtime-import.ts'

type PostprocessStep = (code: string) => string

const STEPS: Record<string, PostprocessStep> = {
  rewriteTypesRuntimeImport,
}

/**
 * Run any post-build steps declared on the package. Called after bundle,
 * before link. No-op if the package has no postprocess steps.
 */
export function runPostprocess(code: string, pkg: PackageDefinition): string {
  let out = code
  for (const name of pkg.postprocess ?? []) {
    const step = STEPS[name]
    if (step) out = step(out)
  }
  return out
}
