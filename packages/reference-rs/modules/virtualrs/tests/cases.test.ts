/**
 * VirtualRS station test suite executor.
 * Discovers VRT-* case stations, executes AST rewrites via the native Node-API bridge,
 * runs station-specific semantic specs, and asserts committed output goldens.
 * Provides unified testing for CSS, CVA, function name replacement, and responsive lowering.
 */
import { createStationSuite } from '../../../testing/index.js'
import {
  CASES_DIR,
  CASE_FOLDER,
  compileVirtualCase,
  type VirtualResult,
} from './helpers.js'

createStationSuite<VirtualResult>({
  suiteName: 'virtualrs transforms',
  casesDir: CASES_DIR,
  folderPattern: CASE_FOLDER,
  compile: ctx => compileVirtualCase(ctx),
  goldens: [
    {
      fileName: 'expected.tsx',
      format: 'text',
      extract: r => r.code,
    },
  ],
  normalizeText: text => text.trim().replace(/\r\n/g, '\n'),
})
