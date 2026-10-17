/** Dev-only Overlay diagnostics. Never throws. */
import { isDevelopment } from '../../../core/env/dev'

export function overlayWarn(message: string) {
  if (isDevelopment()) {
    console.error(`[Overlay] ${message}`)
  }
}
