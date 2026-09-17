/**
 * Test file.
 * This file provides coverage for the respective domain.
 * It inputs test cases and emits test results.
 */

import { css } from 'src/system/css'

const card = css({
  display: 'grid',
  '@container (min-width: 420px)': { gridTemplateColumns: '1fr auto' },
  '@container (min-width: 640px)': {
    padding: '4',
  },
})
