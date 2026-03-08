import { globalCss, keyframes } from '@reference-ui/system'
import {
  REF_LIB_GLOBAL_CSS_VALUE,
  REF_LIB_GLOBAL_CSS_VAR,
  REF_LIB_KEYFRAME_NAME,
} from '../../colors.js'

globalCss({
  ':root': {
    [REF_LIB_GLOBAL_CSS_VAR]: REF_LIB_GLOBAL_CSS_VALUE,
  },
})

keyframes({
  [REF_LIB_KEYFRAME_NAME]: {
    from: {
      opacity: '0.25',
      transform: 'scale(0.98)',
    },
    to: {
      opacity: '1',
      transform: 'scale(1)',
    },
  },
})
