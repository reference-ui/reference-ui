/**
 * Test file.
 * This file provides coverage for the respective domain.
 * It inputs test cases and emits test results.
 */

import { cva } from 'src/system/css'

const card = cva({
  base: {
    '@container (min-width: 480px)': { padding: '4' },
  },
})