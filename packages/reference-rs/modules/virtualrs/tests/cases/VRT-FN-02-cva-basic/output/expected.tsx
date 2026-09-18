/**
 * Test file.
 * This file provides coverage for the respective domain.
 * It inputs test cases and emits test results.
 */

import { cva } from 'src/system/css'
const __reference_ui_cva = cva

const button = __reference_ui_cva({ base: { color: 'teal.600' } })
const nested = __reference_ui_cva({ variants: { size: { md: { padding: '4' } } } })
