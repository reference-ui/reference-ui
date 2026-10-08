/**
 * Styletrace station suite executor.
 * Discovers case folders under tests/cases, traces each committed input tree on demand,
 * runs per-station name assertions, enforces unique/sorted name gauges, and diffs
 * committed `output/components.json` goldens. Package stations keep mock libraries
 * under `input/packages/` and compile remaps them into `node_modules/`.
 */
import { createStationSuite } from '../../../testing/index.js'
import {
  CASES_DIR,
  CASE_FOLDER,
  compileStyletraceCase,
  styletraceGauges,
  styletraceGoldens,
  type StyletraceResult,
} from './helpers.js'

createStationSuite<StyletraceResult>({
  suiteName: 'styletrace cases',
  casesDir: CASES_DIR,
  folderPattern: CASE_FOLDER,
  compile: ctx => compileStyletraceCase(ctx),
  goldens: styletraceGoldens,
  standingGauges: styletraceGauges,
})
