/**
 * Atlas station suite executor.
 * Discovers case stations under tests/cases, executes on-demand analysis,
 * runs station semantic specifications, enforces standing schema gauges,
 * and asserts committed JSON analysis and diagnostic goldens.
 */
import { createStationSuite } from '../../../testing/index.js'
import {
  atlasGauges,
  atlasGoldens,
  compileAtlasCase,
  CASES_DIR,
  CASE_FOLDER,
  type AtlasCaseResult,
} from './helpers.js'

createStationSuite<AtlasCaseResult>({
  suiteName: 'atlas cases',
  casesDir: CASES_DIR,
  folderPattern: CASE_FOLDER,
  compile: ctx => compileAtlasCase(ctx),
  goldens: atlasGoldens,
  standingGauges: atlasGauges,
})
