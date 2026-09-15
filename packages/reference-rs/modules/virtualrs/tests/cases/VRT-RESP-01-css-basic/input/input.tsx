/**
 * Test file.
 * This file provides coverage for the respective domain.
 * It inputs test cases and emits test results.
 */

import { css } from 'src/system/css'

const card = css({
  display: 'grid',
  r: {
    420: { gridTemplateColumns: '1fr auto' },
    640: {
      padding: '4',
    },
  },
})
