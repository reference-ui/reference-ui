/**
 * Test file.
 * This file provides coverage for the respective domain.
 * It inputs test cases and emits test results.
 */

import { cva } from 'src/system/css'

const button = cva({ base: { color: 'teal.600' } })
const nested = cva({ variants: { size: { md: { padding: '4' } } } })