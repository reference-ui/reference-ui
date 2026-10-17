/**
 * Tasty case suite executor.
 * Discovers TST-* cases, executes on-demand scanning and emission,
 * runs case semantic specifications, enforces standing schema gauges,
 * and asserts committed manifest and declaration goldens.
 */
import { afterAll } from 'vitest'

import { createStationSuite } from '../../../../testing/index.js'
import {
  CASES_DIR,
  CASE_FOLDER,
  compileTastyCase,
  disposeTastyScratch,
  tastyGauges,
  tastyGoldens,
  type TastyCaseResult,
} from '../harness/helpers.js'

createStationSuite<TastyCaseResult>({
  suiteName: 'tasty cases',
  casesDir: CASES_DIR,
  folderPattern: CASE_FOLDER,
  compile: ctx => compileTastyCase(ctx),
  goldens: tastyGoldens,
  standingGauges: tastyGauges,
})

afterAll(disposeTastyScratch)
