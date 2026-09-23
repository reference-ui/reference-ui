import * as React from 'react'
import { DATA_COLOR_MODE_ATTR } from './constants'

const COLOR_MODE_CONTEXT_SYMBOL = Symbol.for('@reference-ui/ColorModeContext')
const DOCUMENT_CONTEXT_SYMBOL = Symbol.for('@reference-ui/DocumentContext')

export const ColorModeContext: React.Context<string | undefined> =
  ((globalThis as any)[COLOR_MODE_CONTEXT_SYMBOL] ??= React.createContext<string | undefined>(undefined))

export const DocumentContext: React.Context<Document | null> =
  ((globalThis as any)[DOCUMENT_CONTEXT_SYMBOL] ??= React.createContext<Document | null>(null))


/**
 * Safely reads active color mode from document root elements (`<html>` or `<body>`)
 * when React context is unset (e.g. at document level or outside the React tree).
 * Reads canonical DATA_COLOR_MODE_ATTR ('data-panda-theme') only.
 */
export function readDocumentColorMode(doc?: Document | null): string | undefined {
  const targetDoc = doc ?? (typeof document !== 'undefined' ? document : null)
  if (!targetDoc) return undefined
  return (
    targetDoc.documentElement?.getAttribute(DATA_COLOR_MODE_ATTR) ??
    targetDoc.body?.getAttribute(DATA_COLOR_MODE_ATTR) ??
    undefined
  )
}

/**
 * Hook to read the inherited or document-level color mode within a React tree.
 */
export function useColorMode(): string | undefined {
  const contextMode = React.useContext(ColorModeContext)
  const doc = React.useContext(DocumentContext)
  return contextMode ?? readDocumentColorMode(doc)
}

/**
 * Resolves the DOM color mode attribute dictionary for a given mode value.
 */
export function resolveColorModeAttr(mode?: string): { [K in typeof DATA_COLOR_MODE_ATTR]?: string } {
  return mode != null && mode !== '' ? { [DATA_COLOR_MODE_ATTR]: mode } : {}
}
