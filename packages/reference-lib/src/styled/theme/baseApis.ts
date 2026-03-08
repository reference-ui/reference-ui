import { globalCss, keyframes } from '@reference-ui/system'
import {
  REF_LIB_GLOBAL_CSS_VALUE,
  REF_LIB_GLOBAL_CSS_VAR,
  REF_LIB_KEYFRAME_NAME,
} from '../../colors.js'

const baseTypography = {
  fontFamily: 'sans',
  letterSpacing: '-0.01em',
  color: 'gray.900',
} as const

globalCss({
  ':root': {
    '--r-base': '16px',
    '--r-density': '1',
    '--spacing-r': 'calc(var(--r-base) * var(--r-density))',
    [REF_LIB_GLOBAL_CSS_VAR]: REF_LIB_GLOBAL_CSS_VALUE,
  },
  body: {
    fontFamily: 'sans',
    letterSpacing: '-0.01em',
    fontSize: '4r',
    containerType: 'inline-size',
  },
  '.ref-abbr': {
    ...baseTypography,
    textDecoration: 'underline dotted',
    textUnderlineOffset: '0.15em',
    cursor: 'help',
  },
  '.ref-b': {
    ...baseTypography,
    fontWeight: 'bold',
  },
  '.ref-blockquote': {
    ...baseTypography,
    fontSize: '4.5r',
    fontStyle: 'italic',
    lineHeight: '1.6',
    color: 'gray.600',
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid',
    borderLeftColor: 'gray.300',
    paddingLeft: '1em',
    marginLeft: '0',
    marginRight: '0',
    marginTop: '0',
    marginBottom: '1em',
  },
  '.ref-cite': {
    ...baseTypography,
    fontStyle: 'italic',
    color: 'gray.500',
  },
  '.ref-code': {
    ...baseTypography,
    fontFamily: 'mono',
    fontSize: '0.9em',
    backgroundColor: 'gray.100',
    color: 'pink.600',
    paddingInline: '0.4em',
    paddingBlock: '0.15em',
    borderRadius: 'sm',
  },
  '.ref-em': {
    ...baseTypography,
    fontStyle: 'italic',
  },
  '.ref-h1': {
    ...baseTypography,
    fontSize: '9r',
    fontWeight: 'bold',
    lineHeight: '15r',
    marginTop: '0',
    marginBottom: '3r',
  },
  '.ref-h2': {
    ...baseTypography,
    fontSize: '6r',
    fontWeight: 'bold',
    lineHeight: '10r',
    marginTop: '0',
    marginBottom: '3r',
  },
  '.ref-h3': {
    ...baseTypography,
    fontSize: '5r',
    fontWeight: 'bold',
    lineHeight: '10r',
    marginTop: '0',
    marginBottom: '3r',
  },
  '.ref-h4': {
    ...baseTypography,
    fontSize: '4.5r',
    fontWeight: 'bold',
    lineHeight: '8r',
    marginTop: '0',
    marginBottom: '3r',
  },
  '.ref-h5': {
    ...baseTypography,
    fontSize: '4.5r',
    fontWeight: '500',
    lineHeight: '8r',
    marginTop: '0',
    marginBottom: '3r',
  },
  '.ref-h6': {
    ...baseTypography,
    fontSize: '3.5r',
    fontWeight: '600',
    lineHeight: '8r',
    textTransform: 'uppercase',
    marginTop: '0',
    marginBottom: '3r',
  },
  '.ref-i': {
    ...baseTypography,
    fontStyle: 'italic',
  },
  '.ref-kbd': {
    ...baseTypography,
    fontFamily: 'mono',
    letterSpacing: '-0.02em',
    fontSize: '0.85em',
    backgroundColor: 'gray.100',
    color: 'gray.800',
    paddingInline: '0.4em',
    paddingBlock: '0.2em',
    borderRadius: 'sm',
    borderWidth: '1px',
    borderBottomWidth: '2px',
    borderStyle: 'solid',
    borderColor: 'gray.300',
    boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
  },
  '.ref-mark': {
    ...baseTypography,
    backgroundColor: 'yellow.200',
    color: 'gray.900',
    paddingInline: '0.25em',
    borderRadius: 'sm',
  },
  '.ref-p': {
    ...baseTypography,
    fontSize: '4r',
    lineHeight: '1.6',
    marginTop: '0',
    marginBottom: '1em',
  },
  '.ref-pre': {
    ...baseTypography,
    fontFamily: 'mono',
    letterSpacing: '-0.02em',
    fontSize: 'small',
    lineHeight: '1.6',
    backgroundColor: 'gray.900',
    color: 'gray.100',
    padding: '1em',
    borderRadius: 'md',
    overflowX: 'auto',
    whiteSpace: 'pre',
    marginTop: '0',
    marginBottom: '1em',
  },
  '.ref-q': {
    ...baseTypography,
    fontStyle: 'italic',
    _before: {
      content: '"\\201C"',
    },
    _after: {
      content: '"\\201D"',
    },
  },
  '.ref-s': {
    ...baseTypography,
    textDecoration: 'line-through',
    opacity: '0.7',
  },
  '.ref-samp': {
    ...baseTypography,
    fontFamily: 'mono',
    letterSpacing: '-0.02em',
    fontSize: '0.9em',
    backgroundColor: 'gray.50',
    color: 'gray.700',
    paddingInline: '0.3em',
    paddingBlock: '0.1em',
    borderRadius: 'sm',
  },
  '.ref-small': {
    ...baseTypography,
    fontSize: 'small',
    lineHeight: '1.4',
  },
  '.ref-strong': {
    ...baseTypography,
    fontWeight: 'bold',
  },
  '.ref-sub': {
    ...baseTypography,
    fontSize: '0.75em',
    verticalAlign: 'sub',
    lineHeight: '0',
  },
  '.ref-sup': {
    ...baseTypography,
    fontSize: '0.75em',
    verticalAlign: 'super',
    lineHeight: '0',
  },
  '.ref-u': {
    ...baseTypography,
    textDecoration: 'underline',
    textUnderlineOffset: '0.15em',
    textDecorationThickness: '0.08em',
  },
  '.ref-var': {
    ...baseTypography,
    fontFamily: 'serif',
    letterSpacing: 'normal',
    fontStyle: 'italic',
    color: 'blue.600',
  },
})

keyframes({
  fadeIn: {
    from: {
      opacity: '0',
    },
    to: {
      opacity: '1',
    },
  },
  fadeOut: {
    from: {
      opacity: '1',
    },
    to: {
      opacity: '0',
    },
  },
  fadeInUp: {
    from: {
      opacity: '0',
      transform: 'translateY(20px)',
    },
    to: {
      opacity: '1',
      transform: 'translateY(0)',
    },
  },
  fadeInDown: {
    from: {
      opacity: '0',
      transform: 'translateY(-20px)',
    },
    to: {
      opacity: '1',
      transform: 'translateY(0)',
    },
  },
  fadeInLeft: {
    from: {
      opacity: '0',
      transform: 'translateX(-20px)',
    },
    to: {
      opacity: '1',
      transform: 'translateX(0)',
    },
  },
  fadeInRight: {
    from: {
      opacity: '0',
      transform: 'translateX(20px)',
    },
    to: {
      opacity: '1',
      transform: 'translateX(0)',
    },
  },
  slideUp: {
    from: {
      transform: 'translateY(100%)',
    },
    to: {
      transform: 'translateY(0)',
    },
  },
  slideDown: {
    from: {
      transform: 'translateY(-100%)',
    },
    to: {
      transform: 'translateY(0)',
    },
  },
  slideLeft: {
    from: {
      transform: 'translateX(100%)',
    },
    to: {
      transform: 'translateX(0)',
    },
  },
  slideRight: {
    from: {
      transform: 'translateX(-100%)',
    },
    to: {
      transform: 'translateX(0)',
    },
  },
  slideUpOut: {
    from: {
      transform: 'translateY(0)',
    },
    to: {
      transform: 'translateY(-100%)',
    },
  },
  slideDownOut: {
    from: {
      transform: 'translateY(0)',
    },
    to: {
      transform: 'translateY(100%)',
    },
  },
  scaleIn: {
    from: {
      opacity: '0',
      transform: 'scale(0.9)',
    },
    to: {
      opacity: '1',
      transform: 'scale(1)',
    },
  },
  scaleOut: {
    from: {
      opacity: '1',
      transform: 'scale(1)',
    },
    to: {
      opacity: '0',
      transform: 'scale(0.9)',
    },
  },
  scaleUp: {
    from: {
      transform: 'scale(0.95)',
    },
    to: {
      transform: 'scale(1)',
    },
  },
  scaleDown: {
    from: {
      transform: 'scale(1.05)',
    },
    to: {
      transform: 'scale(1)',
    },
  },
  pulse: {
    '0%, 100%': {
      transform: 'scale(1)',
    },
    '50%': {
      transform: 'scale(1.05)',
    },
  },
  heartbeat: {
    '0%, 100%': {
      transform: 'scale(1)',
    },
    '14%': {
      transform: 'scale(1.3)',
    },
    '28%': {
      transform: 'scale(1)',
    },
    '42%': {
      transform: 'scale(1.3)',
    },
    '70%': {
      transform: 'scale(1)',
    },
  },
  spin: {
    from: {
      transform: 'rotate(0deg)',
    },
    to: {
      transform: 'rotate(360deg)',
    },
  },
  spinReverse: {
    from: {
      transform: 'rotate(360deg)',
    },
    to: {
      transform: 'rotate(0deg)',
    },
  },
  rotate90: {
    from: {
      transform: 'rotate(0deg)',
    },
    to: {
      transform: 'rotate(90deg)',
    },
  },
  rotate180: {
    from: {
      transform: 'rotate(0deg)',
    },
    to: {
      transform: 'rotate(180deg)',
    },
  },
  wigglewiggle: {
    '0%, 100%': {
      transform: 'rotate(-3deg)',
    },
    '50%': {
      transform: 'rotate(3deg)',
    },
  },
  bounce: {
    '0%, 100%': {
      transform: 'translateY(0)',
      animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
    },
    '50%': {
      transform: 'translateY(-25%)',
      animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  },
  bounceIn: {
    '0%': {
      opacity: '0',
      transform: 'scale(0.3)',
    },
    '50%': {
      opacity: '1',
      transform: 'scale(1.05)',
    },
    '70%': {
      transform: 'scale(0.9)',
    },
    '100%': {
      transform: 'scale(1)',
    },
  },
  bounceOut: {
    '0%': {
      transform: 'scale(1)',
    },
    '25%': {
      transform: 'scale(0.95)',
    },
    '50%': {
      opacity: '1',
      transform: 'scale(1.1)',
    },
    '100%': {
      opacity: '0',
      transform: 'scale(0.3)',
    },
  },
  shake: {
    '0%, 100%': {
      transform: 'translateX(0)',
    },
    '10%, 30%, 50%, 70%, 90%': {
      transform: 'translateX(-10px)',
    },
    '20%, 40%, 60%, 80%': {
      transform: 'translateX(10px)',
    },
  },
  ping: {
    '0%': {
      transform: 'scale(1)',
      opacity: '1',
    },
    '75%, 100%': {
      transform: 'scale(2)',
      opacity: '0',
    },
  },
  flash: {
    '0%, 50%, 100%': {
      opacity: '1',
    },
    '25%, 75%': {
      opacity: '0',
    },
  },
  glow: {
    '0%, 100%': {
      opacity: '1',
      filter: 'brightness(1)',
    },
    '50%': {
      opacity: '1',
      filter: 'brightness(1.5)',
    },
  },
  shimmer: {
    '0%': {
      backgroundPosition: '-200% 0',
    },
    '100%': {
      backgroundPosition: '200% 0',
    },
  },
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
