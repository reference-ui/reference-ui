/**
 * Atomic case executor. Discovers tests/cases, compiles each input tree, runs
 * the spec, then diffs committed output goldens using the shared station runner.
 * Standing gauges enforce six-layer preamble, CSS grammar, and zero ghost classes.
 * Diagnostic goldens are path-normalized so they do not embed a checkout root.
 */
import { createStationSuite, rewriteAbsoluteRoot } from '../../../testing/index.js'
import {
  atomicGauges,
  atomicGoldens,
  compileCase,
  CASES_DIR,
  CASE_FOLDER,
  type CompileResult,
} from './helpers.js'
import { quarantineFor } from './css-quarantine.js'

createStationSuite<CompileResult>({
  suiteName: 'atomic cases',
  casesDir: CASES_DIR,
  folderPattern: CASE_FOLDER,
  compile: ctx => compileCase(ctx.caseName),
  goldens: atomicGoldens,
  standingGauges: atomicGauges,
  normalizeText: (content, _fileName, context) =>
    rewriteAbsoluteRoot(content, context.caseDir),
  allowedCssProblems: context => quarantineFor(context.caseId),
})
