/**
 * Atomic case executor. Discovers tests/cases, compiles each input tree, runs
 * the spec, then diffs committed output goldens using the shared station runner.
 * Standing gauges enforce six-layer preamble and zero ghost classes.
 */
import { createStationSuite } from '../../../testing/index.js'
import {
  atomicGauges,
  atomicGoldens,
  compileCase,
  CASES_DIR,
  CASE_FOLDER,
  type CompileResult,
} from './helpers.js'

createStationSuite<CompileResult>({
  suiteName: 'atomic cases',
  casesDir: CASES_DIR,
  folderPattern: CASE_FOLDER,
  compile: ctx => compileCase(ctx.caseName),
  goldens: atomicGoldens,
  standingGauges: atomicGauges,
})
