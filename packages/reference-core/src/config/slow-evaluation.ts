// Slow config evaluation: the one warning a sync raises when evaluating ui.config takes too long.
// It takes the measured evaluation time, the config path and the bare package specifiers the config bundle
// left external, and emits a BSS-W-SLOW-CONFIG warning (or nothing under the threshold). The usual cost is
// the @reference-ui/lib barrel, which drags its whole component and icon graph into every sync; the
// warning names it and points at the @reference-ui/lib/baseSystem subpath, otherwise it names the externals.

import { SLOW_CONFIG_CODE } from '../diagnostics/codes.ts'
import { dedupeDiagnostics, formatVerboseWarningLine } from '../diagnostics/format.ts'
import type { CoreDiagnostic } from '../diagnostics/types.ts'

/** Config evaluation past this many ms warns: a data-only config evaluates in tens of ms, the lib barrel in ~1.5 s. */
export const CONFIG_SLOW_EVALUATION_MS = 750

const LIB_BARREL = '@reference-ui/lib'
const LIB_BASE_SYSTEM = '@reference-ui/lib/baseSystem'

export interface ConfigEvaluationTiming {
  configPath: string
  durationMs: number
  /** Bare specifiers the config bundle kept as runtime imports, in first-seen order. */
  externalImports: readonly string[]
}

function slowCause(externalImports: readonly string[]): { message: string; help: string[] } {
  if (externalImports.includes(LIB_BARREL)) {
    return {
      message: `the slow import is the '${LIB_BARREL}' barrel, which loads every component and icon`,
      help: [`import the base system from '${LIB_BASE_SYSTEM}' instead: it is one data module`],
    }
  }
  if (externalImports.length === 0) {
    return { message: 'no package import is to blame, so the config code itself is slow', help: [] }
  }
  return {
    message: `it imports ${externalImports.map((id) => `'${id}'`).join(', ')}; one of them is slow to load`,
    help: ['import only data-only entry points (such as a baseSystem subpath) from ui.config'],
  }
}

/** The slow-config warning for one evaluation, or undefined when it finished under the threshold. */
export function slowConfigDiagnostic(timing: ConfigEvaluationTiming): CoreDiagnostic | undefined {
  if (timing.durationMs <= CONFIG_SLOW_EVALUATION_MS) return undefined
  const cause = slowCause(timing.externalImports)
  return {
    severity: 'warning',
    code: SLOW_CONFIG_CODE,
    message: `ui.config took ${Math.round(timing.durationMs)} ms to evaluate on every sync: ${cause.message}`,
    file: timing.configPath,
    ...(cause.help.length > 0 ? { help: cause.help } : {}),
  }
}

/**
 * Prints each config warning as its own line on stderr. Verbose runs list it with
 * every other warning and --json runs carry it as data, so both skip this line;
 * otherwise a slow config would hide inside the folded warning count.
 */
export function printConfigWarnings(
  diagnostics: readonly CoreDiagnostic[],
  options: { verbose?: boolean; json?: boolean } = {}
): void {
  if (options.verbose === true || options.json === true || diagnostics.length === 0) return
  console.warn(dedupeDiagnostics(diagnostics).map((item) => formatVerboseWarningLine(item)).join('\n'))
}
