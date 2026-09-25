// diag-request.ts — existing-world request setup for the NEO-DIAG request cases.
// It takes a case world dir and emits the built world plus its prepared
// fragments and mutable compile request, so request-level specs can apply
// the registry-documented mutation and compile for real. Mirrors
// prepareCustomWorld in src/diagnostics/repro-world.ts, minus the temp
// world it builds: the case world already exists. That module stays the
// source of truth for the pipeline order; this file tracks it.
import { evaluatePreparedFragments, prepareFragments } from '../../../src/collect/index.ts';
import type { PreparedFragments } from '../../../src/collect/index.ts';
import { loadUserConfig } from '../../../src/config/load.ts';
import type { ScopedCompileRequest } from '../../../src/native/contract.ts';
import { ELEMENT_JSX_NAMES } from '../../../src/native/element-vocabulary.ts';
import { buildCompileRequest } from '../../../src/native/request.ts';
import { releaseScanRetention } from '../../../src/native/retention.ts';
import { applyNormalizeCss } from '../../../src/sync/reset.ts';
import { resolveJsxElements } from '../../../src/system/base/jsx.ts';

/** A built world plus its prepared fragments and mutable request. */
export interface DiagWorld {
  prepared: PreparedFragments;
  request: ScopedCompileRequest;
}

// Request-level repro setup: the case world on disk plus the built request
// the spec mutates before compiling (retention token, host roster, spec).
// The caller compiles and releases, exactly like the request-suite precedent.
export async function prepareDiagWorld(dir: string): Promise<DiagWorld> {
  const config = await loadUserConfig(dir);
  const prepared = await prepareFragments(dir, config);
  try {
    const spec = await evaluatePreparedFragments(dir, config, prepared);
    applyNormalizeCss(spec, config.normalizeCss);
    const requested = resolveJsxElements(config);
    const request = buildCompileRequest({
      spec,
      requested: requested.merged,
      primitiveNames: ELEMENT_JSX_NAMES,
      sourceRoot: dir,
      declarationRoot: dir,
      include: config.include,
      logs: config.logs,
    });
    return { prepared, request };
  } catch (err) {
    await releaseScanRetention(prepared.retentionToken);
    throw err;
  }
}
