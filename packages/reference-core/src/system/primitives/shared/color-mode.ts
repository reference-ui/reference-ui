import * as React from 'react'
import { DATA_COLOR_MODE_ATTR } from './constants'

export const ColorModeContext = React.createContext<string | undefined>(undefined)

/**
 * Safely reads active color mode from document root elements (`<html>` or `<body>`)
 * when React context is unset (e.g. at document level or outside the React tree).
 */
export function readDocumentColorMode(): string | undefined {
  if (typeof document === 'undefined') return undefined
  return (
    document.documentElement.getAttribute(DATA_COLOR_MODE_ATTR) ??
    document.documentElement.getAttribute('data-color-mode') ??
    document.documentElement.getAttribute('data-theme') ??
    document.body?.getAttribute(DATA_COLOR_MODE_ATTR) ??
    document.body?.getAttribute('data-color-mode') ??
    document.body?.getAttribute('data-theme') ??
    undefined
  )
}

/**
 * Hook to read the inherited or document-level color mode within a React tree.
 */
export function useColorMode(): string | undefined {
  const contextMode = React.useContext(ColorModeContext)
  return contextMode ?? readDocumentColorMode()
}

/**
 * Resolves the DOM color mode attribute dictionary for a given mode value.
 */
export function resolveColorModeAttr(mode?: string): { [K in typeof DATA_COLOR_MODE_ATTR]?: string } {
  return mode != null && mode !== '' ? { [DATA_COLOR_MODE_ATTR]: mode } : {}
}
