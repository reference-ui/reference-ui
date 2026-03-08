import { tokens } from '@reference-ui/system'

export const animationTokens = {
  spin: {
    slow: { value: 'spin 4s linear infinite' },
    normal: { value: 'spin 2s linear infinite' },
    fast: { value: 'spin 1s linear infinite' },
  },
  fadeIn: {
    quick: { value: 'fadeIn 0.2s ease-out' },
    normal: { value: 'fadeIn 0.5s ease-out' },
    slow: { value: 'fadeIn 1s ease-out' },
  },
  fadeOut: {
    quick: { value: 'fadeOut 0.2s ease-out' },
    normal: { value: 'fadeOut 0.5s ease-out' },
  },
  slideUp: {
    quick: { value: 'slideUp 0.3s ease-out' },
    normal: { value: 'slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)' },
  },
  slideDown: {
    quick: { value: 'slideDown 0.3s ease-out' },
    normal: { value: 'slideDown 0.5s cubic-bezier(0.4, 0, 0.2, 1)' },
  },
  scaleIn: {
    quick: { value: 'scaleIn 0.2s ease-out' },
    normal: { value: 'scaleIn 0.3s ease-out' },
  },
  pulse: {
    slow: { value: 'pulse 2s ease-in-out infinite' },
    normal: { value: 'pulse 1s ease-in-out infinite' },
    fast: { value: 'pulse 0.5s ease-in-out infinite' },
  },
  bounce: {
    normal: { value: 'bounce 1s ease-in-out infinite' },
    fast: { value: 'bounce 0.5s ease-in-out infinite' },
  },
  ping: {
    normal: { value: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' },
    fast: { value: 'ping 0.5s cubic-bezier(0, 0, 0.2, 1) infinite' },
  },
} as const

tokens({
  animations: animationTokens,
})
