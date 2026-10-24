// Sync's evaluate-and-compile phase: the one spec evaluation and the one native compile of a run.
// It takes the project root, the loaded config and the prepared fragments, and emits the evaluated spec, the engine's
// result (shadow, include and compile diagnostics merged) and the frozen request that carried the spec across the cut.
// It owns the scan retention's release when evaluation or compile throws; sync/index.ts runs the phases around it.

import type { EvaluatedSystemSpec } from '@reference-ui/rust/contracts'
import { compileNative } from '../native/compile.ts'
import type { NativeCompileResult, ScopedCompileRequest } from '../native/contract.ts'
import { buildCompileRequest } from '../native/request.ts'
import { attachScanRetention, dropScanRetention, releaseScanRetention } from '../native/retention.ts'
import { evaluatePreparedFragmentsDetailed, type PreparedFragments } from '../collect/index.ts'
import { hasUpstreamContainerRoot } from '../system/base/container-root.ts'
import { extendedSystemNames } from '../system/base/extended.ts'
import { resolveJsxElements, upstreamJsxHosts } from '../system/base/jsx.ts'
import { ELEMENT_JSX_NAMES } from '../native/element-vocabulary.ts'
import type { ReferenceUIConfig } from '../config/types.ts'
import { includeMatchDiagnostics } from './include-check.ts'
import { markPhase } from './phases.ts'
import { applyNormalizeCss } from './reset.ts'

export interface CompiledSystem {
  spec: EvaluatedSystemSpec
  result: NativeCompileResult
  request: ScopedCompileRequest
}

// First-occurrence dedupe, preserving request order: the engine's qualifier
// list is own-first then this order (extends then layers), so a Set's
// insertion order is exactly the wire order the engine expects.
function deduped(names: readonly string[]): string[] {
  return [...new Set(names)]
}

// Evaluate-once plus the one native compile: fragments become the spec, the
// frozen request carries it across the cut, and the engine drains the live
// scan retention. The finally releases retention when eval or compile throws;
// the happy path clears it once the drain consumes it, so release never runs
// there.
export async function evaluateAndCompile(
  cwd: string,
  config: ReferenceUIConfig,
  prepared: PreparedFragments
): Promise<CompiledSystem> {
  let retentionToken = prepared.retentionToken
  try {
    // The token merge's shadow warnings join the compile warnings they are reported with.
    const { spec, diagnostics: shadows } = await evaluatePreparedFragmentsDetailed(cwd, config, prepared)
    // CORE-LAYER-04: the reset fragment rides the spec only when normalizeCss is
    // not false; the engine prints reset-sourced fragments into @layer reset.
    applyNormalizeCss(spec, config.normalizeCss)
    // The request to the engine: it scans sourceRoot
    // itself (no virtual mirror, no staged declarations — both roots are the
    // project), scoped to the config include globs, and admits the configured
    // hosts plus every generated primitive without an import. The request
    // records what the author asked for: discovery reaches the publish below,
    // never this list. The names an extended upstream publishes ride apart,
    // by system (`upstreamHosts`): an upstream's component renders through its
    // own runtime, so its name never admits a tag as the app's own host.
    const requested = resolveJsxElements(config)
    // The props every upstream (extends and layers) keeps for its components ride the spec, not the
    // request: a compiled package ships no source to trace, so the engine learns them here. They are
    // set only when one names a prop, which keeps the frozen request byte-identical otherwise.
    if (Object.keys(requested.owned).length > 0) spec.jsxOwned = requested.owned
    // Self excluded: the wire list never carries the consumer's own name; the
    // engine constructs own-first itself. Each upstream contributes
    // its transitively-expanded `streams` names (own entry last, per the
    // published shape), so a system reached only through a nested stream —
    // icons under lib — still becomes a qualifier; `.name` is the fallback
    // for hand-authored baseSystems that never carried `streams`. Mirrors the
    // existing transitive readers (mergeStreams, hasUpstreamContainerRoot).
    const upstreamSystems = deduped(
      [...(config.extends ?? []), ...(config.layers ?? [])]
        .flatMap((system) =>
          system.streams && system.streams.length > 0
            ? system.streams.map((stream) => stream.name)
            : [system.name]
        )
        .filter((name) => name !== spec.name)
    )
    // The extends closure among them: the engine's token layer also claims their [data-layer] stamps,
    // so the app's token values win inside their components; a layered system keeps its own.
    const extendedSystems = extendedSystemNames(prepared.upstreamFragments, upstreamSystems, spec.name)
    const request = buildCompileRequest({
      spec,
      requested: requested.local,
      primitiveNames: ELEMENT_JSX_NAMES,
      sourceRoot: cwd,
      declarationRoot: cwd,
      include: config.include,
      logs: config.logs,
      upstreamContainerRoot:
        hasUpstreamContainerRoot([...(config.extends ?? []), ...(config.layers ?? [])]) ||
        undefined,
      upstreamSystems,
      extendedSystems,
      upstreamHosts: upstreamJsxHosts(config),
    })
    attachScanRetention(request, prepared)
    markPhase('evalEnd')
    markPhase('compileStart')
    const result = await compileNative(request)
    markPhase('compileEnd')
    // The drain consumed the retention: nothing left to release.
    retentionToken = undefined
    dropScanRetention(request, prepared)
    // An include that reaches no file drops its tokens silently in the engine, so it is named here.
    const includeWarnings = includeMatchDiagnostics(cwd, config.include)
    return {
      spec,
      result: { ...result, diagnostics: [...shadows, ...includeWarnings, ...result.diagnostics] },
      request,
    }
  } finally {
    await releaseScanRetention(retentionToken)
  }
}
