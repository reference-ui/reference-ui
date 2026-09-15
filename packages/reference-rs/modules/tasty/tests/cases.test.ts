/**
 * Tasty station suite executor.
 * Discovers TST-* case stations, executes on-demand scanning and emission,
 * runs station semantic specifications, enforces standing schema gauges,
 * and asserts committed manifest and declaration goldens.
 */
import { createStationSuite } from '../../../testing/index.js'
import {
  CASES_DIR,
  CASE_FOLDER,
  compileTastyCase,
  tastyGauges,
  tastyGoldens,
  type TastyCaseResult,
} from './helpers.js'

createStationSuite<TastyCaseResult>({
  suiteName: 'tasty cases',
  casesDir: CASES_DIR,
  folderPattern: CASE_FOLDER,
  compile: (ctx) => compileTastyCase(ctx),
  goldens: tastyGoldens,
  standingGauges: tastyGauges,
})
