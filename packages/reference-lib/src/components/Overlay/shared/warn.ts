/** Dev-only Overlay diagnostics. Never throws. */

export function overlayWarn(message: string) {
  const isProd =
    typeof process !== 'undefined' && process.env?.NODE_ENV === 'production'
  if (!isProd) {
    console.error(`[Overlay] ${message}`)
  }
}
